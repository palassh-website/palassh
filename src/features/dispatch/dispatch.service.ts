import { db } from "@/lib/db";

export interface AdminDispatchSheetRow {
  orderId: string;
  customerName: string;
  phone: string;
  email: string;
  societyAndFlat: string;
  slot: string;
  orderType: "SUBSCRIPTION" | "ADD_ON_ONLY";
  planTitle: string;
  dayNumber: number;
  todaysFlowers: string;
  addOnFlowers: string; // Shows e.g. "150g Mixed Shevanti (#PLS-ADDON-...)" or "-"
  deliveryNote: string;
  status: "DISPATCH_READY" | "PAUSED_TODAY";
  rawScheduleStatus: string;
}

export async function buildDispatchSheetForDate(targetDate: string): Promise<{
  targetDate: string;
  totalPouchesReady: number;
  dispatchRows: AdminDispatchSheetRow[];
  csvContent: string;
}> {
  const [subSchedules, oneTimeOrders] = await Promise.all([
    db.dailyDeliverySchedule.findMany({
      where: { deliveryDate: targetDate },
      include: {
        subscription: {
          include: { customer: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.oneTimeOrder.findMany({
      where: {
        deliveryDate: targetDate,
        status: { not: "CANCELLED" },
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Index Add-On orders by customerId so they appear directly in the subscriber's Add-On column!
  const addOnsByCustomerId = new Map<string, typeof oneTimeOrders>();
  const matchedAddOnIds = new Set<string>();

  for (const ord of oneTimeOrders) {
    const list = addOnsByCustomerId.get(ord.customerId) || [];
    list.push(ord);
    addOnsByCustomerId.set(ord.customerId, list);
  }

  const dispatchRows: AdminDispatchSheetRow[] = [];

  for (const row of subSchedules) {
    const sub = row.subscription;
    const cust = sub.customer;
    const isPausedOrCancelled =
      row.status === "PAUSED" ||
      row.status === "CANCELLED" ||
      sub.status !== "ACTIVE";

    const customerAddOns = addOnsByCustomerId.get(cust.id) || [];
    customerAddOns.forEach((a) => matchedAddOnIds.add(a.id));

    const addOnText =
      customerAddOns.length > 0
        ? customerAddOns
            .map((a) => `${a.flowerSummary} (#${a.orderId})`)
            .join(" + ")
        : "-";

    dispatchRows.push({
      orderId: sub.orderId,
      customerName: cust.fullName,
      phone: cust.phone,
      email: cust.email,
      societyAndFlat: sub.addressSnapshot,
      slot: "6:00 AM – 8:00 AM",
      orderType: "SUBSCRIPTION",
      planTitle: sub.planTitle,
      dayNumber: row.dayNumber,
      todaysFlowers: sub.defaultFlowers,
      addOnFlowers: addOnText,
      deliveryNote:
        row.orderNote ||
        sub.deliveryNote ||
        "Hang pouch on main door handle (Do not ring bell)",
      status: isPausedOrCancelled ? "PAUSED_TODAY" : "DISPATCH_READY",
      rawScheduleStatus: row.status,
    });
  }

  // If an Add-On was booked for a date where no subscription row matched, still include it so no order is ever missed
  for (const ord of oneTimeOrders) {
    if (matchedAddOnIds.has(ord.id)) continue;
    dispatchRows.push({
      orderId: ord.orderId,
      customerName: ord.customer.fullName,
      phone: ord.customer.phone,
      email: ord.customer.email,
      societyAndFlat: ord.addressSnapshot,
      slot: "6:00 AM – 8:00 AM",
      orderType: "ADD_ON_ONLY",
      planTitle: `Subscriber Add-On (${ord.totalGrams}g)`,
      dayNumber: 1,
      todaysFlowers: "-",
      addOnFlowers: `${ord.flowerSummary} (#${ord.orderId})`,
      deliveryNote:
        ord.deliveryNote ||
        "Hang pouch on main door handle (Do not ring bell)",
      status: "DISPATCH_READY",
      rawScheduleStatus: ord.status,
    });
  }

  // Bug 10 Fix: Prevent Excel CSV Formula / DDE Injection (=, +, -, @, \t, \r)
  const esc = (val: string | number) => {
    let str = String(val ?? "").replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };
  const csvHeader = [
    "Order ID",
    "Delivery Date",
    "Plan / Tier",
    "Delivery Day #",
    "Customer Name",
    "Customer Phone (+91)",
    "Plan Pouch (Flowers & Weight)",
    "Add-On (100g / 150g)",
    "Flat / Society / Pincode",
    "Doorstep Note",
    "Dispatch Status",
  ].join(",");

  const csvLines = dispatchRows.map((r) =>
    [
      esc(r.orderId),
      esc(targetDate),
      esc(r.planTitle),
      esc(r.dayNumber),
      esc(r.customerName),
      esc(r.phone),
      esc(r.todaysFlowers),
      esc(r.addOnFlowers || "-"),
      esc(r.societyAndFlat),
      esc(r.deliveryNote),
      esc(r.status),
    ].join(",")
  );

  const csvContent = "\uFEFF" + [csvHeader, ...csvLines].join("\r\n");
  const totalPouchesReady = dispatchRows.filter(
    (r) => r.status === "DISPATCH_READY"
  ).length;

  return {
    targetDate,
    totalPouchesReady,
    dispatchRows,
    csvContent,
  };
}

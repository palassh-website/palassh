import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveCustomerSession, setCustomerSessionCookie } from "@/lib/auth";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { checkPincodeAvailability } from "@/features/pincode-checker/pincode.service";

// Sliding window rate limiter: max 5 requests per 60 seconds per customerId
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const updateHistory = new Map<string, number[]>();

function isRateLimited(customerId: string): boolean {
  const now = Date.now();
  const pastTimestamps = (updateHistory.get(customerId) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (pastTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  pastTimestamps.push(now);
  updateHistory.set(customerId, pastTimestamps);
  return false;
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("ACC-UPDATE");
  const getElapsed = startTimer();

  try {
    const session = await getActiveCustomerSession();
    if (!session?.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Please log in or verify your account session first.",
        },
        { status: 401 }
      );
    }

    if (isRateLimited(session.customerId)) {
      logger.warn({
        module: "ACCOUNT",
        action: "PROFILE_UPDATE_RATE_LIMITED",
        traceId,
        message: `Customer ${session.customerId} exceeded profile update rate limit.`,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many profile updates. Please wait 60 seconds before saving your preferences again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    const fullName = String(body.fullName || "").trim();
    const flatWing = String(body.flatWing || "").trim();
    const societyName = String(body.societyName || "").trim();
    const pincode = String(body.pincode || "").trim();
    const deliveryNote = String(body.deliveryNote || "").trim();

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your valid Full Name." },
        { status: 400 }
      );
    }

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: "Please select a valid Thane pincode." },
        { status: 400 }
      );
    }

    const pinCheck = checkPincodeAvailability(pincode);
    if (!pinCheck.serviceable) {
      return NextResponse.json(
        {
          success: false,
          error:
            pinCheck.message ||
            "We currently deliver only to Thane pincodes 400601 to 400608.",
        },
        { status: 400 }
      );
    }

    // SECURITY GUARANTEE: Phone number is strictly NOT updated. It remains immutable.
    const updatedCustomer = await db.customer.update({
      where: { id: session.customerId },
      data: {
        fullName,
        flatWing,
        societyName,
        pincode,
        deliveryNote:
          deliveryNote || "Hang pouch on main door handle (Do not ring bell)",
      },
    });

    // Sync active subscriptions' delivery notes and address snapshot
    const activeAddressSnapshot = [
      flatWing,
      societyName,
      `Thane - ${pincode}`,
      "Maharashtra",
    ]
      .filter(Boolean)
      .join(", ");

    await db.subscription.updateMany({
      where: { customerId: session.customerId, status: "ACTIVE" },
      data: {
        deliveryNote:
          deliveryNote || "Hang pouch on main door handle (Do not ring bell)",
        addressSnapshot: activeAddressSnapshot,
      },
    });

    // Refresh session cookie with updated fullName
    await setCustomerSessionCookie({
      customerId: updatedCustomer.id,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      fullName: updatedCustomer.fullName,
      activeTier: updatedCustomer.activeTier,
    });

    logger.info({
      module: "ACCOUNT",
      action: "PROFILE_UPDATED_OK",
      traceId,
      durationMs: getElapsed(),
      message: `Profile updated for customer ${updatedCustomer.id}`,
    });

    return NextResponse.json({
      success: true,
      traceId,
      customer: {
        id: updatedCustomer.id,
        fullName: updatedCustomer.fullName,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        flatWing: updatedCustomer.flatWing,
        societyName: updatedCustomer.societyName,
        pincode: updatedCustomer.pincode,
        deliveryNote: updatedCustomer.deliveryNote,
        activeTier: updatedCustomer.activeTier,
      },
    });
  } catch (err) {
    logger.error(
      {
        module: "ACCOUNT",
        action: "PROFILE_UPDATE_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Failed to update profile in database",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Server error while saving account preferences.",
      },
      { status: 500 }
    );
  }
}


// src/app/api/admin/plans/route.ts
import { NextResponse } from "next/server";
import { verifyAdminApiAuth } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { INITIAL_PLANS, SubscriptionPlan } from "@/features/catalog/types";
import { invalidateServerStoreConfigCache } from "@/features/checkout/checkout.service";

export async function GET() {
  const authError = await verifyAdminApiAuth();
  if (authError) return authError;
  const row = await db.storeConfig.findUnique({ where: { configKey: "PLANS_CONFIG" } });
  const plans: SubscriptionPlan[] = row?.jsonPayload ? JSON.parse(row.jsonPayload) : INITIAL_PLANS;
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const authError = await verifyAdminApiAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    if (Array.isArray(body.plans) && body.plans.length > 0) {
      await db.storeConfig.upsert({
        where: { configKey: "PLANS_CONFIG" },
        update: { jsonPayload: JSON.stringify(body.plans) },
        create: { configKey: "PLANS_CONFIG", jsonPayload: JSON.stringify(body.plans) },
      });
      invalidateServerStoreConfigCache();
      return NextResponse.json({ success: true, plans: body.plans });
    }
    return NextResponse.json({ error: "Invalid plans array" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update plans" }, { status: 500 });
  }
}
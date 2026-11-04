import { NextResponse } from "next/server";
import { verifyAdminApiAuth } from "@/lib/admin-auth";
interface StoreSettings {
  normalPurchaseAllowed: boolean;
}

let currentSettings: StoreSettings = {
  normalPurchaseAllowed: true,
};

export async function GET() {
  const authError = await verifyAdminApiAuth();
  if (authError) return authError;
  return NextResponse.json(currentSettings);
}

export async function POST(req: Request) {
  const authError = await verifyAdminApiAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    if (typeof body.normalPurchaseAllowed === "boolean") {
      currentSettings.normalPurchaseAllowed = body.normalPurchaseAllowed;
      return NextResponse.json({ success: true, settings: currentSettings });
    }
    return NextResponse.json(
      { error: "Invalid store settings format" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to update store settings" },
      { status: 500 }
    );
  }
}

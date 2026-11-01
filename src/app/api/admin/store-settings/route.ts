import { NextResponse } from "next/server";

interface StoreSettings {
  normalPurchaseAllowed: boolean;
}

let currentSettings: StoreSettings = {
  normalPurchaseAllowed: true,
};

export async function GET() {
  return NextResponse.json(currentSettings);
}

export async function POST(req: Request) {
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

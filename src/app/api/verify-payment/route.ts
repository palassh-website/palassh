import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Deprecated endpoint. Use /api/checkout/create-order and /api/checkout/verify.",
    },
    { status: 410 }
  );
}
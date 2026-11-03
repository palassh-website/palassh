import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Support standard Razorpay response fields as well as clean aliases
    const order_id =
      body.razorpay_order_id || body.order_id || body.razorpayOrderId;
    const payment_id =
      body.razorpay_payment_id || body.payment_id || body.razorpayPaymentId;
    const signature =
      body.razorpay_signature || body.signature || body.razorpaySignature;

    // Validate presence of required fields
    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: order_id, payment_id, and signature are required.",
        },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay key secret is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // Verify signature using HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: Invalid signature mismatch.",
        },
        { status: 400 }
      );
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        order_id,
        payment_id,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error during payment verification",
      },
      { status: 500 }
    );
  }
}


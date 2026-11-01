import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { setCustomerSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const traceId = createTraceId("OTP-VERIFY");
  const getElapsed = startTimer();

  try {
    const body = await req.json();
    const rawCode = String(body.code || "").trim();
    const rawEmail = String(body.email || "")
      .trim()
      .toLowerCase();
    const rawPhone = String(body.phone || "")
      .replace(/\D/g, "")
      .slice(-10);
    const fullName = String(body.fullName || "PALASSH Devotee").trim();

    if (!rawEmail || rawCode.length !== 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter the valid 6-digit verification code sent to your email.",
        },
        { status: 400 }
      );
    }

    // 1. Find matching unused OTP record in MySQL
    const otpRecord = await db.otpVerification.findFirst({
      where: {
        email: rawEmail,
        code: rawCode,
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      logger.warn({
        module: "AUTH_OTP",
        action: "INVALID_OTP_CODE",
        traceId,
        durationMs: getElapsed(),
        message: `Invalid OTP entered for ${rawEmail}`,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code. Please check your email and try again.",
        },
        { status: 401 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "This verification code has expired (valid for 10 mins). Please request a new code.",
        },
        { status: 410 }
      );
    }

    // 2. Mark OTP as used
    await db.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const verifiedPhone = rawPhone || otpRecord.phone || "";

    // 3. Upsert & Link Email <-> Phone in Customer Table (Both marked verified!)
    let customer = await db.customer.findFirst({
      where: {
        OR: [
          { email: rawEmail },
          ...(verifiedPhone ? [{ phone: verifiedPhone }] : []),
        ],
      },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            scheduleDays: {
              orderBy: { dayNumber: "asc" },
            },
          },
        },
        oneTimeOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          email: rawEmail,
          phone: verifiedPhone || `UNLINKED-${Date.now()}`,
          fullName: fullName || "PALASSH Devotee",
          isVerified: true,
        },
        include: {
          subscriptions: {
            include: { scheduleDays: true },
          },
          oneTimeOrders: true,
        },
      });
    } else {
      // Update link so Email and Phone are both verified together
      customer = await db.customer.update({
        where: { id: customer.id },
        data: {
          email: rawEmail,
          ...(verifiedPhone ? { phone: verifiedPhone } : {}),
          ...(body.fullName ? { fullName: String(body.fullName).trim() } : {}),
          isVerified: true,
        },
        include: {
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              scheduleDays: {
                orderBy: { dayNumber: "asc" },
              },
            },
          },
          oneTimeOrders: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
    }

    // 4. Set 90-Day HttpOnly JWT Cookie for Seamless Multi-Device Persistence
    await setCustomerSessionCookie({
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
      fullName: customer.fullName,
      activeTier: customer.activeTier,
    });

    logger.info({
      module: "AUTH_OTP",
      action: "EMAIL_AND_PHONE_VERIFIED",
      traceId,
      durationMs: getElapsed(),
      message: `Verified email ${customer.email} and linked phone ${customer.phone}`,
      meta: {
        customerId: customer.id,
        activeTier: customer.activeTier,
        hasActiveSubscription: customer.subscriptions.length > 0,
      },
    });

    return NextResponse.json({
      success: true,
      traceId,
      customer: {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        fullName: customer.fullName,
        flatWing: customer.flatWing,
        societyName: customer.societyName,
        pincode: customer.pincode,
        deliveryNote: customer.deliveryNote,
        activeTier: customer.activeTier,
        isVerified: customer.isVerified,
      },
      activeSubscription: customer.subscriptions[0] || null,
      oneTimeOrders: customer.oneTimeOrders || [],
      message: `Email & Phone (+91 ${customer.phone}) verified and linked successfully!`,
    });
  } catch (err) {
    logger.error(
      {
        module: "AUTH_OTP",
        action: "VERIFY_OTP_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Unexpected error in /api/auth/verify-otp",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error:
          "Could not link this email/phone (Phone or email may already be linked to another account).",
      },
      { status: 500 }
    );
  }
}
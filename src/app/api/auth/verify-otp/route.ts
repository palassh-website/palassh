import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { setCustomerSessionCookie } from "@/lib/auth";

const MAX_OTP_ATTEMPTS = 5;

function timingSafeCodeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("OTP-VERIFY");
  const getElapsed = startTimer();

  try {
    const body = await req.json();
    const rawCode = String(body.code || "").trim();
    const rawEmailOrIdentifier = String(
      body.email || body.identifier || ""
    )
      .trim()
      .toLowerCase();
    const fullName = String(body.fullName || "PALASSH Devotee").trim();

    if (!rawEmailOrIdentifier || !/^\d{6}$/.test(rawCode)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter the valid 6-digit verification code sent to your email.",
        },
        { status: 400 }
      );
    }

    // Resolve target email if user logged in via 10-digit mobile number on My-Orders
    let lookupEmail = rawEmailOrIdentifier;
    if (!lookupEmail.includes("@")) {
      const cleanedPhone = lookupEmail.replace(/\D/g, "").slice(-10);
      const custByPhone = await db.customer.findUnique({
        where: { phone: cleanedPhone },
      });
      if (!custByPhone) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid verification code or account not found.",
          },
          { status: 401 }
        );
      }
      lookupEmail = custByPhone.email.toLowerCase();
    }

    // 1. Find latest active (unused) OTP record for this email
    const latestOtp = await db.otpVerification.findFirst({
      where: {
        email: lookupEmail,
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired verification code. Please request a new code.",
        },
        { status: 401 }
      );
    }

    if (new Date() > latestOtp.expiresAt) {
      await db.otpVerification.update({
        where: { id: latestOtp.id },
        data: { isUsed: true },
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "This verification code has expired (valid for 10 mins). Please request a new code.",
        },
        { status: 410 }
      );
    }

    // Parse attempt count stored in purpose (e.g. "CHECKOUT_VERIFY:2")
    const [basePurpose, attemptsStr] = String(latestOtp.purpose || "").split(
      ":"
    );
    const currentAttempts = Number(attemptsStr) || 0;

    // 2. Timing-safe code comparison + Brute-Force Attempt Limiter (Max 5 tries)
    if (!timingSafeCodeMatch(latestOtp.code, rawCode)) {
      const nextAttempts = currentAttempts + 1;
      const shouldInvalidate = nextAttempts >= MAX_OTP_ATTEMPTS;

      await db.otpVerification.update({
        where: { id: latestOtp.id },
        data: {
          purpose: `${basePurpose}:${nextAttempts}`,
          ...(shouldInvalidate ? { isUsed: true } : {}),
        },
      });

      logger.warn({
        module: "AUTH_OTP",
        action: "INVALID_OTP_CODE",
        traceId,
        durationMs: getElapsed(),
        message: `Failed OTP attempt ${nextAttempts}/${MAX_OTP_ATTEMPTS} for ${lookupEmail}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: shouldInvalidate
            ? "Too many incorrect attempts. This code has been invalidated—please request a new OTP."
            : "Invalid verification code. Please check your email and try again.",
        },
        { status: 401 }
      );
    }

    // 3. Atomically mark OTP as used so it can never be replayed
    const claimedOtp = await db.otpVerification.updateMany({
      where: { id: latestOtp.id, isUsed: false },
      data: { isUsed: true },
    });

    if (claimedOtp.count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This verification code has already been used.",
        },
        { status: 401 }
      );
    }

    // Bug 2 Fix: NEVER trust body.phone here! Strictly use latestOtp.phone locked during send-otp.
    const lockedPhone = String(latestOtp.phone || "")
      .replace(/\D/g, "")
      .slice(-10);

    const [existingByEmail, existingByPhone] = await Promise.all([
      db.customer.findUnique({ where: { email: lookupEmail } }),
      lockedPhone.length === 10
        ? db.customer.findUnique({ where: { phone: lockedPhone } })
        : Promise.resolve(null),
    ]);

    // Prevent account takeover or P2002 crash if email and phone belong to two different accounts
    if (
      existingByEmail &&
      existingByPhone &&
      existingByEmail.id !== existingByPhone.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This mobile number is already registered with another email address.",
        },
        { status: 409 }
      );
    }

    // Prevent overwriting an existing phone-matched customer's verified email with a different email
    if (
      !existingByEmail &&
      existingByPhone &&
      existingByPhone.email.toLowerCase() !== lookupEmail
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This mobile number is already linked to a different email address.",
        },
        { status: 409 }
      );
    }

    const targetCustomer = existingByEmail || existingByPhone;

    const customer = !targetCustomer
      ? await db.customer.create({
          data: {
            email: lookupEmail,
            phone:
              lockedPhone.length === 10
                ? lockedPhone
                : `UNLINKED-${Date.now()}`,
            fullName: fullName || "PALASSH Devotee",
            isVerified: true,
          },
          include: {
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                scheduleDays: { orderBy: { dayNumber: "asc" } },
              },
            },
            oneTimeOrders: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        })
      : await db.customer.update({
          where: { id: targetCustomer.id },
          data: {
            email: lookupEmail,
            ...(lockedPhone.length === 10 ? { phone: lockedPhone } : {}),
            ...(body.fullName ? { fullName: String(body.fullName).trim() } : {}),
            isVerified: true,
          },
          include: {
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                scheduleDays: { orderBy: { dayNumber: "asc" } },
              },
            },
            oneTimeOrders: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        });

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
        error: "Could not verify OTP code. Please try again.",
      },
      { status: 500 }
    );
  }
}
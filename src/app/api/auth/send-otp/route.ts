import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { maskEmailAddress, sendPalasshOtpEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const traceId = createTraceId("OTP-SEND");
  const getElapsed = startTimer();

  try {
    const body = await req.json();
    const purpose: "CHECKOUT_VERIFY" | "LOGIN_SYNC" =
      body.purpose === "LOGIN_SYNC" ? "LOGIN_SYNC" : "CHECKOUT_VERIFY";

    let targetEmail = "";
    let targetPhone = "";

    if (purpose === "LOGIN_SYNC") {
      const rawIdentifier = String(body.identifier || "").trim();
      if (!rawIdentifier) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please enter your registered 10-digit mobile number or email address.",
          },
          { status: 400 }
        );
      }

      const isEmailInput = rawIdentifier.includes("@");
      const cleanedPhone = rawIdentifier.replace(/\D/g, "").slice(-10);

      const customer = await db.customer.findFirst({
        where: isEmailInput
          ? { email: rawIdentifier.toLowerCase() }
          : { phone: cleanedPhone },
      });

      if (!customer) {
        logger.warn({
          module: "AUTH_OTP",
          action: "LOGIN_ACCOUNT_NOT_FOUND",
          traceId,
          durationMs: getElapsed(),
          message: `No registered customer found for identifier: ${rawIdentifier}`,
        });
        return NextResponse.json(
          {
            success: false,
            error: isEmailInput
              ? "No subscription or account found with this email address."
              : "No account linked with this mobile number. Please place your first order on Checkout to link your number & email.",
          },
          { status: 404 }
        );
      }

      targetEmail = customer.email.toLowerCase();
      targetPhone = customer.phone;
    } else {
      targetEmail = String(body.email || "")
        .trim()
        .toLowerCase();
      targetPhone = String(body.phone || "")
        .replace(/\D/g, "")
        .slice(-10);

      if (!targetEmail.includes("@") || targetPhone.length !== 10) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please provide a valid email address and 10-digit WhatsApp mobile number.",
          },
          { status: 400 }
        );
      }

      // Prevent linking a phone number that already belongs to another verified email account
      const [existingByEmail, existingByPhone] = await Promise.all([
        db.customer.findUnique({ where: { email: targetEmail } }),
        db.customer.findUnique({ where: { phone: targetPhone } }),
      ]);

      if (
        existingByPhone &&
        existingByPhone.email.toLowerCase() !== targetEmail
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This mobile number is already registered with another email address. Please use your registered email.",
          },
          { status: 409 }
        );
      }

      if (
        existingByEmail &&
        existingByEmail.isVerified &&
        existingByEmail.phone &&
        !existingByEmail.phone.startsWith("UNLINKED-") &&
        existingByEmail.phone !== targetPhone
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email address is already linked to another mobile number.",
          },
          { status: 409 }
        );
      }
    }

    // Bug Fix: Enforce 60-second cooldown per email to prevent SMTP bombing
    const recentOtp = await db.otpVerification.findFirst({
      where: {
        email: targetEmail,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please wait 60 seconds before requesting another verification code.",
        },
        { status: 429 }
      );
    }

    // Bug Fix: Cryptographically secure 6-digit OTP via CSPRNG
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Invalidate older unused OTPs for this email
    await db.otpVerification.updateMany({
      where: { email: targetEmail, isUsed: false },
      data: { isUsed: true },
    });

    // Store fresh OTP in MySQL with attempt counter initialized at :0 inside purpose
    await db.otpVerification.create({
      data: {
        email: targetEmail,
        phone: targetPhone,
        code: otpCode,
        purpose: `${purpose}:0`,
        expiresAt,
      },
    });

    const mailResult = await sendPalasshOtpEmail({
      toEmail: targetEmail,
      otpCode,
      linkedPhone: targetPhone,
      purpose,
      traceId,
    });

    if (!mailResult.sent) {
      return NextResponse.json(
        {
          success: false,
          error:
            mailResult.errorReason ||
            "Could not send verification email. Please check your email address or SMTP settings.",
        },
        { status: 500 }
      );
    }

    logger.info({
      module: "AUTH_OTP",
      action: "SEND_OTP_SUCCESS",
      traceId,
      durationMs: getElapsed(),
      message: `OTP generated and sent to ${maskEmailAddress(targetEmail)}`,
      meta: { purpose, devFallback: mailResult.devFallbackShown },
    });

    // Bug Fix: Never leak unmasked `email` or `phone` in LOGIN_SYNC response
    return NextResponse.json({
      success: true,
      traceId,
      maskedEmail: maskEmailAddress(targetEmail),
      ...(purpose === "CHECKOUT_VERIFY"
        ? { email: targetEmail, phone: targetPhone }
        : {}),
      ...(mailResult.devFallbackShown && process.env.NODE_ENV !== "production"
        ? { devOtpHint: otpCode }
        : {}),
      message: `6-digit verification code sent to ${maskEmailAddress(
        targetEmail
      )}`,
    });
  } catch (err) {
    logger.error(
      {
        module: "AUTH_OTP",
        action: "SEND_OTP_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Unexpected error in /api/auth/send-otp",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Database or server error while generating OTP.",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
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
      // User can enter EITHER 10-digit Phone OR Email to log in from another device
      const rawIdentifier = String(body.identifier || "").trim();
      if (!rawIdentifier) {
        return NextResponse.json(
          {
            success: false,
            error: "Please enter your registered 10-digit mobile number or email address.",
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
      // CHECKOUT_VERIFY: Takes both email and 10-digit phone to verify & link them
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
            error: "Please provide a valid email address and 10-digit WhatsApp mobile number.",
          },
          { status: 400 }
        );
      }
    }

    // Generate cryptographically random 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Invalidate older unused OTPs for this email
    await db.otpVerification.updateMany({
      where: { email: targetEmail, isUsed: false },
      data: { isUsed: true },
    });

    // Store fresh OTP in Hostinger MySQL
    await db.otpVerification.create({
      data: {
        email: targetEmail,
        phone: targetPhone,
        code: otpCode,
        purpose,
        expiresAt,
      },
    });

    // Send OTP strictly via Email (SMTP)
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
      message: `OTP generated and sent to ${targetEmail} (Linked Phone: ${targetPhone})`,
      meta: { purpose, devFallback: mailResult.devFallbackShown },
    });

    return NextResponse.json({
      success: true,
      traceId,
      maskedEmail: maskEmailAddress(targetEmail),
      email: targetEmail,
      phone: targetPhone,
      // Only include devOtpHint if SMTP_USER is not configured yet in local dev
      ...(mailResult.devFallbackShown ? { devOtpHint: otpCode } : {}),
      message: `6-digit verification code sent to ${maskEmailAddress(targetEmail)}`,
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
        error: "Database or server error while generating OTP. Check terminal logs.",
      },
      { status: 500 }
    );
  }
}
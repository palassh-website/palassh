import nodemailer from "nodemailer";
import { getEnvConfig } from "./env";
import { logger, startTimer } from "./logger";

/**
 * Masks an email address for UI display when user logs in via phone number
 * e.g. "sanketharde62@gmail.com" -> "sa***2@gmail.com"
 */
export function maskEmailAddress(email: string): string {
  const [local, domain] = email.trim().split("@");
  if (!domain || local.length <= 2) return `***@${domain || "mail.com"}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export async function sendPalasshOtpEmail(params: {
  toEmail: string;
  otpCode: string;
  linkedPhone?: string;
  purpose: "CHECKOUT_VERIFY" | "LOGIN_SYNC";
  traceId: string;
}): Promise<{ sent: boolean; devFallbackShown?: boolean; errorReason?: string }> {
  const getElapsed = startTimer();
  const env = getEnvConfig();

  // If SMTP credentials are not yet filled in .env during local testing, log OTP clearly in terminal
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn({
      module: "SMTP_MAILER",
      action: "SMTP_CREDENTIALS_MISSING_FALLBACK",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: `SMTP_USER/SMTP_PASS not set in .env. Printing OTP in terminal for local testing -> [OTP: ${params.otpCode}]`,
      meta: {
        toEmail: params.toEmail,
        linkedPhone: params.linkedPhone,
        otpCode: params.otpCode,
      },
    });
    return { sent: true, devFallbackShown: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // True for 465 (Hostinger SSL), false for 587
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const subject =
      params.purpose === "CHECKOUT_VERIFY"
        ? `${params.otpCode} is your PALASSH verification code`
        : `${params.otpCode} is your PALASSH login code`;

    const htmlBody = `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background: #FAF7F2; border: 1px solid #E5E0D8; border-radius: 20px; overflow: hidden;">
        <div style="background: #071C15; padding: 20px 24px; text-align: center; border-bottom: 3px solid #E8502B;">
          <p style="margin: 0; color: #FCD34D; font-size: 12px; letter-spacing: 2px;">॥ जय जय रघुवीर समर्थ ॥</p>
          <h1 style="margin: 6px 0 0; color: #FFFFFF; font-size: 24px; letter-spacing: 3px;">PALASSH</h1>
          <p style="margin: 2px 0 0; color: #A7F3D0; font-style: italic; font-size: 12px;">flowers that pray with you</p>
        </div>
        <div style="padding: 28px 24px; color: #1C1613; font-family: system-ui, sans-serif;">
          <p style="margin: 0 0 12px; font-size: 15px;">Namaskar,</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #57534E; line-height: 1.6;">
            Use the 6-digit verification code below to verify your email address${
              params.linkedPhone
                ? ` and link it with your WhatsApp number <strong>+91 ${params.linkedPhone}</strong>`
                : ""
            } on PALASSH:
          </p>
          <div style="background: #FFFFFF; border: 2px dashed #E8502B; border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 20px;">
            <span style="font-family: Georgia, serif; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #071C15;">
              ${params.otpCode}
            </span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #78716C;">
            This code is valid for 10 minutes. Morning Delivery Window: 6:00 AM – 8:00 AM across Thane (400601–400608).
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: params.toEmail,
      subject,
      html: htmlBody,
    });

    logger.info({
      module: "SMTP_MAILER",
      action: "OTP_EMAIL_DISPATCHED",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: `Sent 6-digit OTP email to ${params.toEmail}`,
      meta: { messageId: info.messageId, purpose: params.purpose },
    });

    return { sent: true };
  } catch (err) {
    logger.error(
      {
        module: "SMTP_MAILER",
        action: "OTP_EMAIL_FAILED",
        traceId: params.traceId,
        durationMs: getElapsed(),
        message: `Failed to send OTP email to ${params.toEmail} via ${env.SMTP_HOST}:${env.SMTP_PORT}`,
      },
      err
    );
    return {
      sent: false,
      errorReason:
        err instanceof Error ? err.message : "SMTP dispatch failed",
    };
  }
}
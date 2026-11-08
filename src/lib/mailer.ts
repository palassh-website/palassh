import nodemailer from "nodemailer";
import { getEnvConfig } from "./env";
import { logger, startTimer } from "./logger";
import { OFFICIAL_WHATSAPP_DISPLAY, getWhatsAppUrl } from "./whatsapp";

export function maskEmailAddress(email: string): string {
  const [local, domain] = email.trim().split("@");
  if (!domain || local.length <= 2) return `***@${domain || "mail.com"}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

function createSmtpTransporter() {
  const env = getEnvConfig();
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
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

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn({
      module: "SMTP_MAILER",
      action: "SMTP_CREDENTIALS_MISSING_FALLBACK",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: `SMTP_USER/SMTP_PASS not set in .env. Printing OTP in terminal -> [OTP: ${params.otpCode}]`,
    });
    return { sent: true, devFallbackShown: true };
  }

  try {
    const transporter = createSmtpTransporter();
    const subject =
      params.purpose === "CHECKOUT_VERIFY"
        ? `${params.otpCode} is your PALASSH verification code`
        : `${params.otpCode} is your PALASSH login code`;

    const htmlBody = `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background: #FAF6F0; border: 1px solid #E6DEC8; border-radius: 20px; overflow: hidden;">
        <div style="background: #1C1917; padding: 20px 24px; text-align: center; border-bottom: 3px solid #D95326;">  
          <h1 style="margin: 6px 0 0; color: #FFFFFF; font-size: 24px; letter-spacing: 3px;">PALASSH</h1>
          <p style="margin: 2px 0 0; color: #F5D0A9; font-style: italic; font-size: 12px;">flowers that pray with you</p>
        </div>
        <div style="padding: 28px 24px; color: #1C1917; font-family: system-ui, sans-serif;">
          <p style="margin: 0 0 12px; font-size: 15px;">Namaskar,</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #57534E; line-height: 1.6;">
            Use the 6-digit verification code below to verify your email address${params.linkedPhone
        ? ` and link it with your WhatsApp number <strong>+91 ${params.linkedPhone}</strong>`
        : ""
      } on PALASSH:
          </p>
          <div style="background: #FFFFFF; border: 2px dashed #D95326; border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 20px;">
            <span style="font-family: Georgia, serif; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1C1917;">
              ${params.otpCode}
            </span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #78716C;">
            Valid for 10 minutes • Support: <a href="${getWhatsAppUrl()}" style="color: #D95326; text-decoration: none; font-weight: bold;">${OFFICIAL_WHATSAPP_DISPLAY}</a>
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_FROM || `"PALASSH Flowers" <${env.SMTP_USER}>`,
      replyTo: "care@palassh.com",
      to: params.toEmail,
      subject,
      html: htmlBody,
    });

    return { sent: true };
  } catch (err) {
    logger.error(
      {
        module: "SMTP_MAILER",
        action: "OTP_EMAIL_FAILED",
        traceId: params.traceId,
        durationMs: getElapsed(),
        message: `Failed to send OTP email to ${params.toEmail}`,
      },
      err
    );
    return {
      sent: false,
      errorReason: err instanceof Error ? err.message : "SMTP dispatch failed",
    };
  }
}

/**
 * Point #6: Sends a ONE-TIME Plan Activation / Order Confirmation Email to the customer
 * when they purchase a plan or loose flower order.
 * Displays Plan Activation Status, First Delivery Date, Last Delivery Date, and Contact (+917710942605+).
 */
export async function sendOrderConfirmationEmail(params: {
  toEmail: string;
  customerName: string;
  phone: string;
  orderId: string;
  orderType: "SUBSCRIPTION" | "ONE_TIME";
  planTitle: string;
  flowerSelection: string;
  amountPaid: number;
  totalDeliveries: number;
  firstDeliveryDate: string;
  lastDeliveryDate: string;
  addressSnapshot: string;
  traceId: string;
}): Promise<boolean> {
  const getElapsed = startTimer();
  const env = getEnvConfig();

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.info({
      module: "SMTP_MAILER",
      action: "ORDER_EMAIL_SKIPPED_NO_SMTP",
      traceId: params.traceId,
      message: `Order ${params.orderId} confirmed for ${params.toEmail} (First: ${params.firstDeliveryDate}, Last: ${params.lastDeliveryDate})`,
    });
    return false;
  }

  try {
    const transporter = createSmtpTransporter();
    // Use no-reply@palassh.com display header (with authenticated SMTP_USER fallback if Hostinger requires matching sender)
    const fromHeader = env.SMTP_USER.includes("@")
      ? `"PALASSH Flowers (No-Reply)" <${env.SMTP_USER}>`
      : `"PALASSH Flowers" <no-reply@palassh.com>`;

    const subject =
      params.orderType === "SUBSCRIPTION"
        ? `Plan Activated (#${params.orderId}) — ${params.planTitle} | PALASSH Flowers`
        : `Order Confirmed (#${params.orderId}) — PALASSH Flowers`;

    const htmlBody = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #FAF6F0; border: 1px solid #E6DEC8; border-radius: 20px; overflow: hidden;">
        <div style="background: #1C1917; padding: 22px 24px; text-align: center; border-bottom: 3px solid #D95326;">
      
          <h1 style="margin: 6px 0 0; color: #FFFFFF; font-size: 24px; letter-spacing: 3px;">PALASSH</h1>
          <p style="margin: 2px 0 0; color: #F5D0A9; font-style: italic; font-size: 12px;">flowers that pray with you</p>
        </div>
        <div style="padding: 28px 24px; color: #1C1917; font-family: system-ui, sans-serif;">
          <span style="display: inline-block; background: #FFF3EC; color: #D95326; border: 1px solid #D95326; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
            ${params.orderType === "SUBSCRIPTION"
        ? "✓ PLAN ACTIVATED & CONFIRMED"
        : "✓ MEMBER ORDER CONFIRMED"
      }
          </span>
          <h2 style="margin: 14px 0 8px; font-family: Georgia, serif; font-size: 22px; color: #1C1917;">
            Namaskar ${params.customerName},
          </h2>
          <p style="margin: 0 0 20px; font-size: 14px; color: #57534E; line-height: 1.6;">
            Thank you for choosing PALASSH. Your ${params.orderType === "SUBSCRIPTION"
        ? `<strong>${params.planTitle}</strong> subscription is now <strong>ACTIVE</strong>`
        : "member flower order is confirmed"
      }. This is your one-time confirmation receipt containing your complete delivery schedule.
          </p>

          <div style="background: #FFFFFF; border: 1px solid #E6DEC8; border-radius: 16px; padding: 18px; margin-bottom: 20px; font-size: 13px; line-height: 1.8;">
            <div><strong>Order ID:</strong> #${params.orderId}</div>
            <div><strong>Plan / Type:</strong> ${params.planTitle} (${params.totalDeliveries
      } ${params.totalDeliveries === 1 ? "Morning Delivery" : "Morning Deliveries"})</div>
            <div><strong>Selected Flowers:</strong> ${params.flowerSelection}</div>
            <div><strong>Amount Paid:</strong> ₹${params.amountPaid.toLocaleString(
        "en-IN"
      )} (Prepaid)</div>
            <hr style="border: 0; border-top: 1px dashed #E6DEC8; margin: 10px 0;" />
            <div style="color: #D95326;"><strong>First Delivery Date:</strong> ${params.firstDeliveryDate
      } (6:00 AM – 8:00 AM)</div>
            <div style="color: #1C1917;"><strong>Last Delivery Date:</strong> ${params.lastDeliveryDate
      } (6:00 AM – 8:00 AM)</div>
            <div><strong>Delivery Address:</strong> ${params.addressSnapshot}</div>
          </div>

          <div style="background: #F3ECE1; border: 1px solid #E6DEC8; border-radius: 14px; padding: 14px 16px; font-size: 12px; color: #44403C;">
            <strong>Need Help or WhatsApp Support?</strong><br />
            Contact Us: <a href="${getWhatsAppUrl()}" style="color: #D95326; text-decoration: underline; font-weight: bold;">${OFFICIAL_WHATSAPP_DISPLAY}</a> (WhatsApp / Call)<br />
            You can pause deliveries or add a doorstep note anytime before 8:00 PM from the <strong>My Orders</strong> calendar on palassh.com.
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: fromHeader,
      replyTo: "care@palassh.com",
      to: params.toEmail,
      subject,
      html: htmlBody,
    });

    logger.info({
      module: "SMTP_MAILER",
      action: "ORDER_CONFIRMATION_EMAIL_SENT",
      traceId: params.traceId,
      durationMs: getElapsed(),
      message: `Sent one-time plan activation email for ${params.orderId} to ${params.toEmail}`,
    });
    return true;
  } catch (err) {
    logger.error(
      {
        module: "SMTP_MAILER",
        action: "ORDER_CONFIRMATION_EMAIL_FAILED",
        traceId: params.traceId,
        durationMs: getElapsed(),
        message: `Failed to send order confirmation email to ${params.toEmail}`,
      },
      err
    );
    return false;
  }
}

/**
 * Point #8: Emails the daily Morning 6-8 AM Dispatch Excel (.CSV) sheet to Admin at midnight
 */
export async function sendAdminDispatchCsvEmail(params: {
  targetDate: string;
  totalPouches: number;
  csvContent: string;
  traceId: string;
}): Promise<{ sent: boolean; recipient: string; errorReason?: string }> {
  const env = getEnvConfig();
  const recipient = env.ADMIN_EMAIL || "admin@palassh.in";

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return {
      sent: false,
      recipient,
      errorReason: "SMTP_USER / SMTP_PASS not configured in .env",
    };
  }

  try {
    const transporter = createSmtpTransporter();
    await transporter.sendMail({
      from: env.SMTP_FROM || `"PALASSH Dispatch Bot" <${env.SMTP_USER}>`,
      to: recipient,
      subject: `PALASSH 6–8 AM Dispatch Excel Sheet (${params.targetDate}) — ${params.totalPouches} Pouches`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 540px; padding: 20px; background: #FAF6F0; border: 1px solid #E6DEC8; border-radius: 16px;">
          <h2 style="margin: 0 0 10px; color: #1C1917;">Morning 6:00 AM – 8:00 AM Dispatch Sheet</h2>
          <p style="margin: 0 0 12px; font-size: 14px; color: #57534E;">
            Attached is the Excel-compatible CSV file for <strong>${params.targetDate}</strong> containing all active subscription deliveries, customer phone numbers, flat addresses, and flower varieties to pack.
          </p>
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #D95326;">
            Total Pouches Ready to Pack: ${params.totalPouches}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `PALASSH-Dispatch-${params.targetDate}.csv`,
          content: params.csvContent,
          contentType: "text/csv; charset=utf-8",
        },
      ],
    });

    return { sent: true, recipient };
  } catch (err) {
    return {
      sent: false,
      recipient,
      errorReason: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
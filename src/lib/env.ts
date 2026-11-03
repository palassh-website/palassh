import { logger } from "./logger";

export interface EnvHealthReport {
  hasDatabaseUrl: boolean;
  hasSmtpConfig: boolean;
  hasRazorpayConfig: boolean;
  hasJwtSecret: boolean;
  missingKeys: string[];
}

export function getEnvConfig() {
  return {
    DATABASE_URL: process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "palassh-dev-fallback-secret-key-2026",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@palassh.in",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "palassh@2026",

    // Hostinger / Gmail / Brevo SMTP
    SMTP_HOST: process.env.SMTP_HOST || "smtp.hostinger.com",
    SMTP_PORT: Number(process.env.SMTP_PORT || 465),
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",
    SMTP_FROM: process.env.SMTP_FROM || "PALASSH Flowers <care@palassh.com>",

    // Razorpay
    RAZORPAY_KEY_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  };
}

export function inspectEnvHealth(traceId?: string): EnvHealthReport {
  const cfg = getEnvConfig();
  const missingKeys: string[] = [];

  if (!cfg.DATABASE_URL) missingKeys.push("DATABASE_URL");
  if (!cfg.SMTP_USER) missingKeys.push("SMTP_USER");
  if (!cfg.SMTP_PASS) missingKeys.push("SMTP_PASS");
  if (!cfg.RAZORPAY_KEY_ID) missingKeys.push("NEXT_PUBLIC_RAZORPAY_KEY_ID");
  if (!cfg.RAZORPAY_KEY_SECRET) missingKeys.push("RAZORPAY_KEY_SECRET");

  if (missingKeys.length > 0) {
    logger.warn({
      module: "DATABASE",
      action: "ENV_KEYS_MISSING",
      traceId,
      message: `Missing environment variables: ${missingKeys.join(", ")}`,
      meta: { missingKeys },
    });
  }

  return {
    hasDatabaseUrl: Boolean(cfg.DATABASE_URL),
    hasSmtpConfig: Boolean(cfg.SMTP_USER && cfg.SMTP_PASS),
    hasRazorpayConfig: Boolean(cfg.RAZORPAY_KEY_ID && cfg.RAZORPAY_KEY_SECRET),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    missingKeys,
  };
}
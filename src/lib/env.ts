import { logger } from "./logger";

export interface EnvHealthReport {
  hasDatabaseUrl: boolean;
  hasSmtpConfig: boolean;
  hasRazorpayConfig: boolean;
  hasJwtSecret: boolean;
  missingKeys: string[];
}

/**
 * Strips accidental surrounding quotes (" or ') and whitespace from .env values
 * so Base64 Basic Auth headers for Razorpay never fail due to formatting.
 */
function cleanEnvValue(raw: string | undefined, fallback = ""): string {
  if (!raw) return fallback;
  return raw
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

export function getEnvConfig() {
  const keyId = cleanEnvValue(
    process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  );
  const keySecret = cleanEnvValue(process.env.RAZORPAY_KEY_SECRET);

  return {
    DATABASE_URL: cleanEnvValue(process.env.DATABASE_URL),
    JWT_SECRET: cleanEnvValue(
      process.env.JWT_SECRET,
      "palassh-dev-fallback-secret-key-2026"
    ),
    ADMIN_EMAIL: cleanEnvValue(process.env.ADMIN_EMAIL, "admin@palassh.in"),
    ADMIN_PASSWORD: cleanEnvValue(process.env.ADMIN_PASSWORD, "palassh@2026"),

    // Hostinger / Gmail / Brevo SMTP
    SMTP_HOST: cleanEnvValue(process.env.SMTP_HOST, "smtp.hostinger.com"),
    SMTP_PORT: Number(cleanEnvValue(process.env.SMTP_PORT, "465")),
    SMTP_USER: cleanEnvValue(process.env.SMTP_USER),
    SMTP_PASS: cleanEnvValue(process.env.SMTP_PASS),
    SMTP_FROM: cleanEnvValue(
      process.env.SMTP_FROM,
      "PALASSH Flowers <care@palassh.com>"
    ),

    // Razorpay (Strictly sanitized)
    RAZORPAY_KEY_ID: keyId,
    RAZORPAY_KEY_SECRET: keySecret,
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
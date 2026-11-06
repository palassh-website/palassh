import { logger } from "./logger";

export interface EnvHealthReport {
  hasDatabaseUrl: boolean;
  hasSmtpConfig: boolean;
  hasRazorpayConfig: boolean;
  hasJwtSecret: boolean;
  missingKeys: string[];
}

function cleanEnvValue(raw: string | undefined, fallback = ""): string {
  if (!raw) return fallback;
  return raw
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

export function getEnvConfig() {
  const isProd = process.env.NODE_ENV === "production";

  const databaseUrl = cleanEnvValue(process.env.DATABASE_URL);
  const jwtSecret = cleanEnvValue(process.env.JWT_SECRET);
  const adminEmail = cleanEnvValue(process.env.ADMIN_EMAIL);
  const adminPassword = cleanEnvValue(process.env.ADMIN_PASSWORD);

  // Fail closed in production if required critical secrets are missing
  if (isProd) {
    const missing: string[] = [];
    if (!databaseUrl) missing.push("DATABASE_URL");
    if (!jwtSecret || jwtSecret.includes("dev-fallback")) missing.push("JWT_SECRET");
    if (!adminEmail) missing.push("ADMIN_EMAIL");
    if (!adminPassword) missing.push("ADMIN_PASSWORD");

    if (missing.length > 0) {
      throw new Error(
        `[FATAL_SECURITY_ERROR] Missing required production environment variables: ${missing.join(
          ", "
        )}. Application startup aborted.`
      );
    }
  }

  return {
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret || "palassh-dev-fallback-secret-key-2026",
    ADMIN_EMAIL: adminEmail || "care@palassh.com",
    ADMIN_PASSWORD: adminPassword || "palassh@2026",

    SMTP_HOST: cleanEnvValue(process.env.SMTP_HOST, "smtp.hostinger.com"),
    SMTP_PORT: Number(cleanEnvValue(process.env.SMTP_PORT, "465")),
    SMTP_USER: cleanEnvValue(process.env.SMTP_USER),
    SMTP_PASS: cleanEnvValue(process.env.SMTP_PASS),
    SMTP_FROM: cleanEnvValue(
      process.env.SMTP_FROM,
      "PALASSH Flowers <no-reply@palassh.com>"
    ),

    RAZORPAY_KEY_ID: cleanEnvValue(
      process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    ),
    RAZORPAY_KEY_SECRET: cleanEnvValue(process.env.RAZORPAY_KEY_SECRET),
    RAZORPAY_WEBHOOK_SECRET: cleanEnvValue(process.env.RAZORPAY_WEBHOOK_SECRET),
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
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("dev-fallback")) {
    missingKeys.push("JWT_SECRET");
  }

  if (missingKeys.length > 0) {
    logger.warn({
      module: "DATABASE",
      action: "ENV_KEYS_MISSING",
      traceId,
      message: `Missing or insecure environment variables: ${missingKeys.join(", ")}`,
      meta: { missingKeys },
    });
  }

  return {
    hasDatabaseUrl: Boolean(cfg.DATABASE_URL),
    hasSmtpConfig: Boolean(cfg.SMTP_USER && cfg.SMTP_PASS),
    hasRazorpayConfig: Boolean(cfg.RAZORPAY_KEY_ID && cfg.RAZORPAY_KEY_SECRET),
    hasJwtSecret: Boolean(process.env.JWT_SECRET && !process.env.JWT_SECRET.includes("dev-fallback")),
    missingKeys,
  };
}
type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export type LogModule =
  | "LAYOUT"
  | "HERO"
  | "PINCODE"
  | "CATALOG"
  | "CHECKOUT"
  | "ORDERS"
  | "ADMIN"
  | "ADMIN_LOGIN"
  | "ADMIN_DASHBOARD"
  | "ALL_PRODUCTS"
  | "DIRECT_FLOWER_STORE"
  | "DATABASE"
  | "AUTH_OTP"
  | "SMTP_MAILER"
  | "RAZORPAY";

export interface LogPayload {
  module: LogModule;
  action: string;
  message: string;
  traceId?: string;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

/**
 * Generates a short 8-char correlation ID so you can trace a single request across API -> DB -> SMTP
 */
export function createTraceId(prefix = "REQ"): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

/**
 * Measures execution time in milliseconds for easy performance & bottleneck debugging
 */
export function startTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

function extractErrorDetails(error: unknown): Record<string, unknown> {
  if (!error) return {};
  if (error instanceof Error) {
    const anyErr = error as Error & { code?: string; meta?: unknown };
    return {
      errorName: error.name,
      errorMessage: error.message,
      prismaOrSystemCode: anyErr.code || undefined,
      prismaMeta: anyErr.meta || undefined,
      stackPreview: error.stack
        ? error.stack.split("\n").slice(0, 3).join(" | ")
        : undefined,
    };
  }
  return { rawError: String(error) };
}

function writeLog(level: LogLevel, payload: LogPayload, error?: unknown) {
  const timestamp = new Date().toISOString();
  const errorInfo = error ? extractErrorDetails(error) : undefined;

  const entry = {
    timestamp,
    level,
    traceId: payload.traceId || "GLOBAL",
    module: payload.module,
    action: payload.action,
    message: payload.message,
    ...(payload.durationMs !== undefined ? { durationMs: payload.durationMs } : {}),
    ...(payload.meta ? { meta: payload.meta } : {}),
    ...(errorInfo ? { errorDetails: errorInfo } : {}),
  };

  // In local development, print a clean human-readable prefix + JSON meta
  if (process.env.NODE_ENV !== "production") {
    const tag = `[${level}] [${entry.module}:${entry.action}] (${entry.traceId})${
      entry.durationMs !== undefined ? ` [${entry.durationMs}ms]` : ""
    }`;

    if (level === "ERROR") {
      console.error(`❌ ${tag} -> ${entry.message}`, errorInfo || payload.meta || "");
    } else if (level === "WARN") {
      console.warn(`⚠️ ${tag} -> ${entry.message}`, payload.meta || "");
    } else {
      console.log(`✅ ${tag} -> ${entry.message}`, payload.meta || "");
    }
    return;
  }

  // In production (Vercel), output single-line structured JSON for log search
  const serialized = JSON.stringify(entry);
  if (level === "ERROR") console.error(serialized);
  else if (level === "WARN") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  info: (payload: LogPayload) => writeLog("INFO", payload),
  warn: (payload: LogPayload) => writeLog("WARN", payload),
  debug: (payload: LogPayload) => writeLog("DEBUG", payload),
  error: (payload: LogPayload, error?: unknown) => writeLog("ERROR", payload, error),
};
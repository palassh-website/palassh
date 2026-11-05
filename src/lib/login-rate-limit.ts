import crypto from "crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Database-backed failed-login throttle.
 *
 * Serverless functions don't share memory between requests, so the counter lives
 * in the existing StoreConfig table. After MAX_FAILURES wrong attempts inside
 * WINDOW_MS the caller is locked out for WINDOW_MS.
 *
 * Trade-offs (deliberate):
 *  - Keyed per client IP, not globally, so an attacker cannot lock the real
 *    admin out of their own account.
 *  - Reads and writes are not atomic, so simultaneous attempts can undercount a
 *    little. That is fine for slowing brute force.
 *  - If the database is unreachable the limiter fails open (logs a warning)
 *    rather than blocking every login.
 */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface Bucket {
  count: number;
  windowStart: number;
  lockedUntil?: number;
}

function bucketKey(scope: string, identifier: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(identifier)
    .digest("hex")
    .slice(0, 32);
  return `RATE_${scope}_${hash}`;
}

async function readBucket(key: string): Promise<Bucket | null> {
  const row = await db.storeConfig.findUnique({ where: { configKey: key } });
  if (!row?.jsonPayload) return null;
  try {
    return JSON.parse(row.jsonPayload) as Bucket;
  } catch {
    return null;
  }
}

/** Seconds the caller must still wait, or 0 when they may try. */
export async function getLockoutSeconds(
  scope: string,
  identifier: string
): Promise<number> {
  try {
    const bucket = await readBucket(bucketKey(scope, identifier));
    if (bucket?.lockedUntil && bucket.lockedUntil > Date.now()) {
      return Math.ceil((bucket.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  } catch (err) {
    logger.warn({
      module: "ADMIN_LOGIN",
      action: "RATE_LIMIT_READ_FAILED_FAIL_OPEN",
      message: "Could not read login throttle; allowing the attempt.",
      meta: { err: String(err) },
    });
    return 0;
  }
}

export async function recordFailure(
  scope: string,
  identifier: string
): Promise<void> {
  try {
    const key = bucketKey(scope, identifier);
    const now = Date.now();
    const existing = await readBucket(key);

    const inWindow = existing && now - existing.windowStart <= WINDOW_MS;
    const count = inWindow ? existing.count + 1 : 1;
    const next: Bucket = {
      count,
      windowStart: inWindow ? existing.windowStart : now,
      ...(count >= MAX_FAILURES ? { lockedUntil: now + WINDOW_MS } : {}),
    };

    await db.storeConfig.upsert({
      where: { configKey: key },
      update: { jsonPayload: JSON.stringify(next) },
      create: { configKey: key, jsonPayload: JSON.stringify(next) },
    });
  } catch (err) {
    logger.warn({
      module: "ADMIN_LOGIN",
      action: "RATE_LIMIT_WRITE_FAILED_FAIL_OPEN",
      message: "Could not record a failed login attempt.",
      meta: { err: String(err) },
    });
  }
}

export async function clearFailures(
  scope: string,
  identifier: string
): Promise<void> {
  try {
    await db.storeConfig.deleteMany({
      where: { configKey: bucketKey(scope, identifier) },
    });
  } catch {
    // Nothing to clear or DB unavailable; a stale bucket expires on its own.
  }
}

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { getEnvConfig } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import {
  clearFailures,
  getLockoutSeconds,
  recordFailure,
} from "@/lib/login-rate-limit";
import { createTraceId, logger, startTimer } from "@/lib/logger";

const RATE_LIMIT_SCOPE = "ADMIN_LOGIN";

function getAdminSecretKey(): Uint8Array {
  const { JWT_SECRET } = getEnvConfig();
  return new TextEncoder().encode(JWT_SECRET);
}

/** Constant-time string comparison (hashes first so lengths always match). */
function safeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("ADM-LOGIN");
  const getElapsed = startTimer();

  try {
    const clientIp = getClientIp(req);

    // Locked-out callers are stopped before any credential is even compared.
    const lockedSeconds = await getLockoutSeconds(RATE_LIMIT_SCOPE, clientIp);
    if (lockedSeconds > 0) {
      logger.warn({
        module: "ADMIN_LOGIN",
        action: "ADMIN_LOGIN_LOCKED_OUT",
        traceId,
        durationMs: getElapsed(),
        message: `Blocked admin login attempt from a locked-out client (${lockedSeconds}s left).`,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Too many failed attempts. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(lockedSeconds) } }
      );
    }

    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "").trim();

    const env = getEnvConfig();
    const expectedEmail = env.ADMIN_EMAIL.trim().toLowerCase();
    const expectedPassword = env.ADMIN_PASSWORD.trim();

    // Evaluate both checks (no short-circuit) so timing doesn't reveal which was wrong.
    const emailOk = safeEqual(email, expectedEmail);
    const passwordOk = safeEqual(password, expectedPassword);

    if (!(emailOk && passwordOk)) {
      await recordFailure(RATE_LIMIT_SCOPE, clientIp);
      logger.warn({
        module: "ADMIN_LOGIN",
        action: "INVALID_ADMIN_CREDENTIALS",
        traceId,
        durationMs: getElapsed(),
        message: "Failed admin login attempt.",
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin email or password.",
        },
        { status: 401 }
      );
    }

    await clearFailures(RATE_LIMIT_SCOPE, clientIp);

    const token = await new SignJWT({
      email: expectedEmail,
      role: "PALASSH_ADMIN",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getAdminSecretKey());

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 Days
    });

    logger.info({
      module: "ADMIN_LOGIN",
      action: "ADMIN_LOGIN_SUCCESS",
      traceId,
      durationMs: getElapsed(),
      message: `Admin ${expectedEmail} logged in successfully.`,
    });

    return NextResponse.json({
      success: true,
      traceId,
      email: expectedEmail,
    });
  } catch (err) {
    logger.error(
      {
        module: "ADMIN_LOGIN",
        action: "ADMIN_LOGIN_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Unexpected error in /api/admin/login",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Server error during admin authentication.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}

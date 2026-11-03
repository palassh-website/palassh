import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnvConfig } from "@/lib/env";
import { createTraceId, logger, startTimer } from "@/lib/logger";

export const ADMIN_SESSION_COOKIE = "palassh_admin_session";

function getAdminSecretKey(): Uint8Array {
  const { JWT_SECRET } = getEnvConfig();
  return new TextEncoder().encode(JWT_SECRET);
}

export async function verifyAdminSessionCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, getAdminSecretKey());
    return payload.role === "PALASSH_ADMIN";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("ADM-LOGIN");
  const getElapsed = startTimer();

  try {
    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "").trim();

    const env = getEnvConfig();
    const expectedEmail = env.ADMIN_EMAIL.trim().toLowerCase();
    const expectedPassword = env.ADMIN_PASSWORD.trim();

    if (email !== expectedEmail || password !== expectedPassword) {
      logger.warn({
        module: "ADMIN_LOGIN",
        action: "INVALID_ADMIN_CREDENTIALS",
        traceId,
        durationMs: getElapsed(),
        message: `Failed admin login attempt for email: ${email}`,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid admin email or password.",
        },
        { status: 401 }
      );
    }

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
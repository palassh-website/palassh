import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnvConfig } from "./env";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

function getAdminSecretKey(): Uint8Array {
  const { JWT_SECRET } = getEnvConfig();
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Validates the admin session cookie for protected admin API endpoints.
 * Returns null if authorized, or a 401 NextResponse if unauthorized.
 */
export async function verifyAdminApiAuth(): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing admin session cookie." },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, getAdminSecretKey());
    if (payload.role !== "PALASSH_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient privileges." },
        { status: 403 }
      );
    }

    return null; // Authorized
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or expired admin session." },
      { status: 401 }
    );
  }
}

/**
 * Validates incoming automated requests via a secure secret header for cron endpoints.
 */
export function verifyCronApiAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false; // Fail closed if secret is not configured
  }

  return authHeader === `Bearer ${cronSecret}`;
}
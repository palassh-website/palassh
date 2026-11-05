import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getEnvConfig } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

/**
 * Next.js 16 "proxy" (formerly middleware): gate every /admin page behind a
 * valid admin session cookie.
 *
 * It uses the same JWT secret handling as the admin API routes (getEnvConfig),
 * which refuses to run in production without a real JWT_SECRET. If the secret is
 * missing the token check fails and the visitor is sent to the login page.
 */

async function isAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(getEnvConfig().JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload.role === "PALASSH_ADMIN";
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdmin = await isAdminToken(token);

  // Login page: signed-in admins go straight to the dashboard.
  if (pathname.startsWith("/admin/login")) {
    return isAdmin
      ? NextResponse.redirect(new URL("/admin", req.url))
      : NextResponse.next();
  }

  // Every other /admin route requires a valid admin session.
  if (isAdmin) return NextResponse.next();

  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  if (token) res.cookies.delete(ADMIN_SESSION_COOKIE); // drop an invalid/stale cookie
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};

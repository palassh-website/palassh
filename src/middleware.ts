import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_SESSION_COOKIE = "palassh_admin_session";

function getSecretKey(): Uint8Array {
  const raw = (
    process.env.JWT_SECRET || "palassh-dev-fallback-secret-key-2026"
  )
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
  return new TextEncoder().encode(raw);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page itself
  if (pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, getSecretKey());
        if (payload.role === "PALASSH_ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      } catch {
        // Invalid token -> let them stay on /admin/login
      }
    }
    return NextResponse.next();
  }

  // Protect /admin and any sub-routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      if (payload.role !== "PALASSH_ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete(ADMIN_SESSION_COOKIE);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
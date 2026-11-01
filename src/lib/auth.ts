import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnvConfig } from "./env";
import { logger } from "./logger";

export const CUSTOMER_SESSION_COOKIE = "palassh_customer_session";

export interface CustomerSessionPayload {
  customerId: string;
  email: string;
  phone: string;
  fullName: string;
  activeTier: string;
}

function getSecretKey(): Uint8Array {
  const { JWT_SECRET } = getEnvConfig();
  return new TextEncoder().encode(JWT_SECRET);
}

export async function signCustomerSessionToken(
  payload: CustomerSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(getSecretKey());
}

export async function verifyCustomerSessionToken(
  token: string
): Promise<CustomerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.customerId || !payload.email) return null;
    return {
      customerId: String(payload.customerId),
      email: String(payload.email),
      phone: String(payload.phone || ""),
      fullName: String(payload.fullName || ""),
      activeTier: String(payload.activeTier || "NORMAL"),
    };
  } catch {
    return null;
  }
}

export async function setCustomerSessionCookie(
  payload: CustomerSessionPayload
): Promise<void> {
  const token = await signCustomerSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 Days persistence
  });
}

export async function getActiveCustomerSession(): Promise<CustomerSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!token) return null;
    return await verifyCustomerSessionToken(token);
  } catch (err) {
    logger.warn({
      module: "AUTH_OTP",
      action: "READ_SESSION_COOKIE_WARN",
      message: "Could not read customer session cookie",
      meta: { err: String(err) },
    });
    return null;
  }
}
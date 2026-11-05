import { getEnvConfig } from "@/lib/env";

/** HTTP Basic auth header value for server-to-server Razorpay API calls. */
export function razorpayBasicAuthHeader(): string {
  const env = getEnvConfig();
  return Buffer.from(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");
}

export type RazorpayRefundResult =
  | { ok: true; refundId: string }
  | { ok: false; reason: string };

/**
 * Issues a full or partial refund for a captured payment.
 * Never throws: callers get a result they can log and act on.
 */
export async function refundRazorpayPayment(params: {
  paymentId: string;
  amountInPaise: number;
  notes?: Record<string, string>;
}): Promise<RazorpayRefundResult> {
  try {
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        params.paymentId
      )}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${razorpayBasicAuthHeader()}`,
        },
        body: JSON.stringify({
          amount: params.amountInPaise,
          speed: "normal",
          notes: params.notes ?? {},
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: { description?: string; reason?: string };
    };

    if (!res.ok || !data.id) {
      return {
        ok: false,
        reason:
          data.error?.description ||
          data.error?.reason ||
          `Razorpay refund HTTP ${res.status}`,
      };
    }

    return { ok: true, refundId: data.id };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Refund request failed",
    };
  }
}

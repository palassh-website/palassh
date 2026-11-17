import { NextRequest, NextResponse } from "next/server";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import { sendAdminReviewNotificationEmail } from "@/lib/mailer";
import { getLockoutSeconds, recordFailure } from "@/lib/login-rate-limit";

/**
 * POST /api/reviews
 *
 * Receives a review from the homepage form and emails it to the admin.
 * It does NOT store anything: the on-page review wall still works exactly as
 * before (browser-only). This route only sends the notification.
 *
 * The endpoint is public, so it is defended against abuse:
 *  - body size cap and strict field validation
 *  - length limits on every text field
 *  - per-IP throttle (reuses the existing DB-backed limiter, which allows
 *    5 counted attempts per 15 minutes per IP; the limiter's own name says
 *    "failure", here each accepted submission counts as one attempt)
 *  - all text is HTML-escaped inside the email (see mailer)
 */

const RATE_LIMIT_SCOPE = "REVIEW_SUBMIT";
const MAX_BODY_CHARS = 8_000;
const MAX_NAME = 80;
const MAX_SOCIETY = 120;
const MAX_QUOTE = 1_000;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Single-line text: control characters removed, whitespace collapsed. */
function cleanLine(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Multi-line text: keeps line breaks and tabs, removes other control chars. */
function cleanMultiline(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("REVIEW");
  const getElapsed = startTimer();

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) {
      return NextResponse.json({ success: false }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("not an object");
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const reviewerName = cleanLine(body.name, MAX_NAME);
    const society = cleanLine(body.society, MAX_SOCIETY);
    const quote = cleanMultiline(body.quote, MAX_QUOTE);
    const rating = Number(body.rating);

    if (
      !reviewerName ||
      !quote ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const clientIp = getClientIp(req);
    const lockedSeconds = await getLockoutSeconds(RATE_LIMIT_SCOPE, clientIp);
    if (lockedSeconds > 0) {
      logger.warn({
        module: "SMTP_MAILER",
        action: "REVIEW_RATE_LIMITED",
        traceId,
        durationMs: getElapsed(),
        message: "Review email blocked by the per-IP throttle.",
      });
      return NextResponse.json(
        { success: false },
        { status: 429, headers: { "Retry-After": String(lockedSeconds) } }
      );
    }
    await recordFailure(RATE_LIMIT_SCOPE, clientIp);

    const result = await sendAdminReviewNotificationEmail({
      reviewerName,
      society,
      rating,
      quote,
      traceId,
    });

    return NextResponse.json(
      { success: result.sent },
      { status: result.sent ? 200 : 502 }
    );
  } catch (err) {
    logger.error(
      {
        module: "SMTP_MAILER",
        action: "REVIEW_ROUTE_EXCEPTION",
        traceId,
        durationMs: getElapsed(),
        message: "Unexpected error in /api/reviews",
      },
      err
    );
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

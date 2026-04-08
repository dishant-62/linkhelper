import { NextRequest, NextResponse } from "next/server";
import { runDailyCron } from "@/lib/cron";

/**
 * POST /api/cron/daily
 *
 * Triggers the daily notification cron job.
 * Secured with a shared secret passed in the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Intended to be called by an external scheduler (e.g. GitHub Actions,
 * Vercel Cron, or a cURL command) once per day.
 */
/**
 * POST /api/cron/daily
 *
 * Triggers the daily notification cron job.
 * Secured with a shared secret passed in the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Intended to be called by an external scheduler (e.g. GitHub Actions,
 * Vercel Cron, or a cURL command) once per day.
 *
 * CRON_SECRET must be set in the environment. Requests without a valid
 * secret are always rejected.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/daily] CRON_SECRET is not configured");
    return NextResponse.json(
      { error: "Cron endpoint is not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const enqueued = await runDailyCron();
    return NextResponse.json({ ok: true, enqueued });
  } catch (err) {
    console.error("[cron/daily] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

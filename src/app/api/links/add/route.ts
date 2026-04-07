import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { processLink } from "@/lib/process-link";

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Input validation ────────────────────────────────────────────────────────
  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "url must be a valid http or https URL" },
      { status: 400 }
    );
  }

  // ── Create stub record ──────────────────────────────────────────────────────
  const link = await db.link.create({
    data: { url, userId: session.user.id },
  });

  // ── Enrich (scrape + AI) — runs inline; move to queue worker for async use ──
  await processLink(link.id, url);

  // ── Return enriched record ──────────────────────────────────────────────────
  const enriched = await db.link.findUnique({ where: { id: link.id } });

  return NextResponse.json(
    {
      ...enriched,
      tags: (() => {
        try {
          return JSON.parse(enriched?.tags ?? "[]");
        } catch {
          return [];
        }
      })(),
    },
    { status: 201 }
  );
}

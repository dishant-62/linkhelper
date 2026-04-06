import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { summarizeUrl, suggestTags } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { content?: string };
  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const [summary, tags] = await Promise.all([
    summarizeUrl(content),
    suggestTags(content),
  ]);

  return NextResponse.json({ summary, tags });
}

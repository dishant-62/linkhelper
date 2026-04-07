import { db } from "@/lib/db";
import { fetchMetadata } from "@/lib/scraper";
import { analyzeLink } from "@/lib/ai";

/**
 * Enriches a previously-created Link record by:
 *   1. Fetching metadata from the URL (title, description, thumbnail)
 *   2. Sending the page content to OpenAI for category/tags/summary
 *   3. Persisting the enriched data back to the DB
 *
 * The function signature is intentionally compatible with the BullMQ job
 * payload defined in queue.ts so it can be used directly inside a Worker:
 *
 *   createLinkWorker(async (job) => {
 *     await processLink(job.data.linkId, job.data.url);
 *   });
 */
export async function processLink(linkId: string, url: string): Promise<void> {
  // ── 1. Scrape metadata ─────────────────────────────────────────────────────
  let title: string | null = null;
  let description: string | null = null;
  let thumbnail: string | null = null;
  let bodyText = "";

  try {
    const meta = await fetchMetadata(url);
    title = meta.title;
    description = meta.description;
    thumbnail = meta.thumbnail;
    bodyText = meta.bodyText;
  } catch {
    // Non-fatal — continue with empty content
  }

  // ── 2. AI analysis ────────────────────────────────────────────────────────
  let category = "General";
  let tags: string[] = [];
  let summary = "No summary available";

  try {
    const analysis = await analyzeLink(bodyText || url, url);
    category = analysis.category;
    tags = analysis.tags;
    summary = analysis.summary;
  } catch {
    // Fallback values already set above
  }

  // ── 3. Persist enriched link ──────────────────────────────────────────────
  await db.link.update({
    where: { id: linkId },
    data: {
      title,
      description,
      thumbnail,
      category,
      tags: JSON.stringify(tags),
      summary,
    },
  });
}

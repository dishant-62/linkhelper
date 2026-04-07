/**
 * Link-processing worker.
 *
 * Run this as a standalone Node process (not inside Next.js):
 *   npx tsx src/workers/link-worker.ts
 *
 * It consumes jobs from the `link-processing` BullMQ queue and uses
 * processLink() to scrape metadata + run AI analysis.
 */
import { createLinkWorker } from "@/lib/queue";
import { processLink } from "@/lib/process-link";

const worker = createLinkWorker(async (job) => {
  const { linkId, url } = job.data;
  console.log(`[link-worker] Processing link ${linkId}: ${url}`);
  await processLink(linkId, url);
  console.log(`[link-worker] Done: ${linkId}`);
});

worker.on("completed", (job) => {
  console.log(`[link-worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[link-worker] Job ${job?.id} failed:`, err);
});

console.log("[link-worker] Worker started, waiting for jobs…");

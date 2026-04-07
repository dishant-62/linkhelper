/**
 * Notification worker.
 *
 * Run this as a standalone Node process (not inside Next.js):
 *   npx tsx src/workers/notification-worker.ts
 *
 * It consumes jobs from the `notifications` BullMQ queue and sends
 * the "forgotten gems" digest email via Nodemailer.
 */
import { createNotificationWorker } from "@/lib/queue";
import { sendNotificationEmail } from "@/lib/email";
import { db } from "@/lib/db";

const worker = createNotificationWorker(async (job) => {
  const { userId, userEmail, userName, links } = job.data;
  console.log(
    `[notification-worker] Sending digest to ${userEmail} (${links.length} links)`
  );

  await sendNotificationEmail(userEmail, userName, links);

  // Record Notification rows so we can track delivery
  for (const link of links) {
    try {
      await db.notification.create({
        data: { userId, linkId: link.id },
      });
    } catch {
      // Ignore duplicates or constraint errors
    }
  }

  console.log(`[notification-worker] Sent digest to ${userEmail}`);
});

worker.on("completed", (job) => {
  console.log(`[notification-worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[notification-worker] Job ${job?.id} failed:`, err);
});

console.log("[notification-worker] Worker started, waiting for jobs…");

import { db } from "@/lib/db";
import { notificationQueue } from "@/lib/queue";
import type { NotificationJobData } from "@/lib/queue";

const MIN_PICKS = 3;
const MAX_PICKS = 5;
const FORGOTTEN_DAYS = 10;

/**
 * Runs the daily notification job for all users:
 * 1. Finds links the user hasn't clicked in the last FORGOTTEN_DAYS days.
 * 2. Selects MIN_PICKS–MAX_PICKS of them (prioritising high-priority categories).
 * 3. Enqueues a notification job so the worker can send the email.
 *
 * Returns the number of notification jobs enqueued.
 */
export async function runDailyCron(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FORGOTTEN_DAYS);

  const highPriorityCategories = [
    "Technology",
    "Science",
    "Education",
    "Programming",
    "Research",
  ];

  // Fetch all users who have at least one link
  const users = await db.user.findMany({
    where: { links: { some: {} } },
    select: { id: true, email: true, name: true },
  });

  let enqueued = 0;

  for (const user of users) {
    // Find forgotten links: no engagement (click) within the cutoff window
    const forgottenLinks = await db.link.findMany({
      where: {
        userId: user.id,
        engagements: {
          none: { clickedAt: { gte: cutoff } },
        },
      },
      orderBy: [
        // Prefer high-priority categories first
        { category: "asc" },
        { createdAt: "asc" },
      ],
    });

    if (forgottenLinks.length === 0) continue;

    // Sort: high-priority categories first, then oldest first
    const sorted = forgottenLinks.sort((a, b) => {
      const aHigh = highPriorityCategories.includes(a.category ?? "");
      const bHigh = highPriorityCategories.includes(b.category ?? "");
      if (aHigh && !bHigh) return -1;
      if (!aHigh && bHigh) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const picks = sorted.slice(0, MAX_PICKS);
    if (picks.length < MIN_PICKS) continue; // not enough links to send

    const now = Date.now();
    const jobData: NotificationJobData = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name ?? user.email,
      links: picks.map((link) => ({
        id: link.id,
        url: link.url,
        title: link.title,
        summary: link.summary,
        savedDaysAgo: Math.floor(
          (now - link.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
    };

    await notificationQueue.add("daily-notification", jobData, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });

    enqueued++;
  }

  return enqueued;
}

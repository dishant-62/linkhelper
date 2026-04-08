import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

// ─── Link processing queue ────────────────────────────────────────────────────

export const linkProcessingQueue = new Queue("link-processing", {
  connection,
});

/** @deprecated Use linkProcessingQueue */
export const linkQueue = linkProcessingQueue;

export interface LinkJobData {
  linkId: string;
  url: string;
  userId: string;
}

export function createLinkWorker(
  processor: (job: Job<LinkJobData>) => Promise<void>
) {
  return new Worker<LinkJobData>("link-processing", processor, { connection });
}

// ─── Notification queue ───────────────────────────────────────────────────────

export const notificationQueue = new Queue("notifications", { connection });

export interface NotificationJobData {
  userId: string;
  userEmail: string;
  userName: string;
  links: Array<{
    id: string;
    url: string;
    title: string | null;
    summary: string | null;
    savedDaysAgo: number;
  }>;
}

export function createNotificationWorker(
  processor: (job: Job<NotificationJobData>) => Promise<void>
) {
  return new Worker<NotificationJobData>("notifications", processor, {
    connection,
  });
}

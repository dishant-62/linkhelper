import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const linkQueue = new Queue("link-processing", { connection });

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

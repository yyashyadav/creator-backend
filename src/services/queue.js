import { Queue } from "bullmq";
import IORedis from "ioredis";
import { getRedisConnectionConfig } from "../config/redis.js";

let connection;
let renderQueue;

function getConnection() {
  if (!connection) {
    connection = new IORedis(getRedisConnectionConfig());
  }
  return connection;
}

export function getRenderQueue() {
  if (!renderQueue) {
    renderQueue = new Queue("video-render", {
      connection: getRedisConnectionConfig(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return renderQueue;
}

export async function enqueueRenderJob({ videoId, projectId, userId }) {
  const queue = getRenderQueue();
  const jobId = String(videoId);
  const existing = await queue.getJob(jobId);
  if (existing) {
    await existing.remove();
  }
  await queue.add(
    "render",
    { videoId: jobId, projectId: String(projectId), userId: String(userId) },
    { jobId }
  );
}

export async function cancelRenderJob(videoId) {
  const queue = getRenderQueue();
  const job = await queue.getJob(String(videoId));
  if (!job) return false;

  const state = await job.getState();
  if (state === "active") {
    return false;
  }

  await job.remove();
  return true;
}

// PR-05: AI processing must run separately from normal request handling so long
// LLM calls never block the API. Start simple (in-process queue); swap for BullMQ /
// a worker process later without changing callers.

type Job = () => Promise<void>;

const queue: Job[] = [];
let running = false;

export const enqueueAiJob = (job: Job) => {
  queue.push(job);
  void drain();
};

const drain = async () => {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    try {
      await job();
    } catch (err) {
      console.error('AI job failed:', err);
    }
  }
  running = false;
};

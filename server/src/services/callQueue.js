// Simple in-memory rate-limited queue to respect ~1.1s between calls
const MIN_SPACING_MS = 1100;
let lastCallAt = 0;
const queue = [];
let running = false;

export function enqueue(job) {
  return new Promise((resolve, reject) => {
    queue.push({ job, resolve, reject });
    run();
  });
}

async function run() {
  if (running) return;
  running = true;
  while (queue.length) {
    const now = Date.now();
    const wait = Math.max(0, MIN_SPACING_MS - (now - lastCallAt));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    const { job, resolve, reject } = queue.shift();
    try {
      const res = await job();
      lastCallAt = Date.now();
      resolve(res);
    } catch (e) {
      reject(e);
    }
  }
  running = false;
}

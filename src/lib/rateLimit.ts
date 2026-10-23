// Simple in-memory rate limiter. Good enough for a single-instance deployment
// (Render/Railway/a VPS). On serverless platforms with multiple cold-started
// instances (Vercel functions), each instance keeps its own counts — for a
// stricter guarantee there, swap this for a Redis/Upstash-backed limiter.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  bucket.count++;
  return { ok: true, remaining: limit - bucket.count };
}

// Periodic cleanup so the map doesn't grow unbounded on a long-running process.
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000);
// setInterval's return type differs between Node (Timeout, has .unref()) and
// the DOM lib (number, doesn't) — this project's tsconfig includes "dom" for
// the frontend, so we guard at runtime instead of relying on the type.
if (typeof (cleanupInterval as unknown as { unref?: () => void })?.unref === 'function') {
  (cleanupInterval as unknown as { unref: () => void }).unref();
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'unknown';
}

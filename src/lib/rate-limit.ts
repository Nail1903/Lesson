/**
 * Minimal in-process sliding-window rate limiter.
 * Good enough for a single-instance personal deployment. For horizontal scale,
 * swap the `store` for Redis/Upstash — the `limit()` signature stays the same.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function limit(
  key: string,
  max: number,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: max - 1, resetAt };
  }

  bucket.count += 1;
  const ok = bucket.count <= max;
  return { ok, remaining: Math.max(0, max - bucket.count), resetAt: bucket.resetAt };
}

// Opportunistic cleanup so the map does not grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
}, 120_000).unref?.();

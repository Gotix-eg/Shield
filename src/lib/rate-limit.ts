const trackers = new Map<string, { count: number; lastReset: number }>();

/**
 * Simple in-memory rate limiter.
 * Note: In serverless environments like Vercel, this is per-instance.
 */
export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60000) {
  const now = Date.now();
  const tracker = trackers.get(ip) || { count: 0, lastReset: now };

  if (now - tracker.lastReset > windowMs) {
    tracker.count = 0;
    tracker.lastReset = now;
  }

  tracker.count++;
  trackers.set(ip, tracker);

  return {
    success: tracker.count <= limit,
    remaining: Math.max(0, limit - tracker.count),
    limit,
  };
}

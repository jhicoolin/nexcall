// In-memory rate limiter — resets per function instance.
// For multi-instance production use, replace backing store with Redis.

const buckets = new Map();

export function checkRateLimit(key, maxRequests = 5, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

// AI-specific: 5 requests per user per minute
export function checkAiLimit(userId) {
  return checkRateLimit(`ai:${userId}`, 5, 60_000);
}

// Command cooldown: 1 per user per N seconds
export function checkCooldown(userId, command, seconds = 3) {
  return checkRateLimit(`cd:${command}:${userId}`, 1, seconds * 1000);
}

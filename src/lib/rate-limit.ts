import { ApiError } from "./errors";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  scope: string;
  limit: number;
  windowMs: number;
  now?: number;
}

const MAX_BUCKETS = 5_000;

declare global {
  var whyRightRateLimitBuckets: Map<string, RateLimitBucket> | undefined;
}

const buckets =
  globalThis.whyRightRateLimitBuckets ?? new Map<string, RateLimitBucket>();
globalThis.whyRightRateLimitBuckets = buckets;

function clientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const identifier =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  return identifier.slice(0, 128);
}

function pruneBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

/**
 * A bounded, best-effort abuse brake for a single warm server instance.
 * It is intentionally not presented as a deployment-wide cost cap: production
 * still needs an edge/shared rate limiter because serverless instances and
 * regions do not share this process memory.
 */
export function enforceRateLimit(
  request: Request,
  { scope, limit, windowMs, now = Date.now() }: RateLimitOptions,
): void {
  pruneBuckets(now);
  const key = `${scope}:${clientIdentifier(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1_000),
    );
    throw new ApiError(
      "RATE_LIMITED",
      "Too many requests. Wait a moment, then try again.",
      429,
      { "Retry-After": String(retryAfterSeconds) },
    );
  }

  current.count += 1;
}

export function clearRateLimitStateForTests(): void {
  buckets.clear();
}

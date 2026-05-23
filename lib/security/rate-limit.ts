import { prisma } from "@/lib/prisma";

/**
 * Postgres-backed sliding-window rate limiter.
 *
 * Works across Vercel serverless instances (state lives in the DB, not memory).
 * Each unique `key` gets its own bucket. When a bucket exceeds `max` hits
 * within `windowMs`, calls return { allowed: false } and the bucket is locked
 * until `windowStart + windowMs`. Successful calls under the limit increment
 * the counter atomically.
 *
 * Buckets older than `windowMs` are silently reset on the next hit (lazy
 * cleanup, no cron required).
 *
 * Returns retryAfterSeconds for HTTP 429 responses.
 */

export interface RateLimitOptions {
  /** Unique identifier for the bucket, e.g. "verify-code:userid:cmoz..." */
  key: string;
  /** Max calls allowed in the window */
  max: number;
  /** Window length in milliseconds */
  windowMs: number;
  /** If set, after `max` is exceeded, lock the key for this many ms (default = windowMs) */
  lockoutMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  /** True iff the request was rejected because of an active lockout (not just window saturation) */
  locked: boolean;
}

/**
 * Atomically check-and-increment the bucket for `key`.
 * Returns whether the call is allowed and how many slots remain.
 */
export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const now      = new Date();
  const lockMs   = opts.lockoutMs ?? opts.windowMs;
  const windowMs = opts.windowMs;

  // Single-statement upsert that handles three cases atomically:
  //   1. New key                  → insert count=1
  //   2. Existing key, fresh win  → reset count=1, windowStart=now
  //   3. Existing key, same win   → count = count + 1
  // Postgres ON CONFLICT handles concurrency; the RETURNING gives us the new state.
  // We do NOT increment if there is an active lockout — instead we report it.
  const rows = await prisma.$queryRawUnsafe<
    Array<{ count: number; window_start: Date; locked_until: Date | null }>
  >(
    `
    INSERT INTO "RateLimit" (id, key, count, "windowStart", "lockedUntil", "updatedAt")
    VALUES (gen_random_uuid()::text, $1, 1, $2::timestamptz, NULL, $2::timestamptz)
    ON CONFLICT (key) DO UPDATE
      SET count        = CASE
                            WHEN "RateLimit"."lockedUntil" IS NOT NULL
                              AND "RateLimit"."lockedUntil" > $2::timestamptz
                              THEN "RateLimit".count
                            WHEN $2::timestamptz - "RateLimit"."windowStart" > ($3 || ' milliseconds')::interval
                              THEN 1
                            ELSE "RateLimit".count + 1
                          END,
          "windowStart"= CASE
                            WHEN "RateLimit"."lockedUntil" IS NOT NULL
                              AND "RateLimit"."lockedUntil" > $2::timestamptz
                              THEN "RateLimit"."windowStart"
                            WHEN $2::timestamptz - "RateLimit"."windowStart" > ($3 || ' milliseconds')::interval
                              THEN $2::timestamptz
                            ELSE "RateLimit"."windowStart"
                          END,
          "lockedUntil"= CASE
                            WHEN "RateLimit"."lockedUntil" IS NOT NULL
                              AND "RateLimit"."lockedUntil" > $2::timestamptz
                              THEN "RateLimit"."lockedUntil"
                            ELSE NULL
                          END,
          "updatedAt"  = $2::timestamptz
    RETURNING count, "windowStart" AS window_start, "lockedUntil" AS locked_until
    `,
    opts.key,
    now,
    String(windowMs),
  );

  const row = rows[0];
  if (!row) return { allowed: false, remaining: 0, retryAfterSeconds: 60, locked: true };

  // Active hard-lockout?
  if (row.locked_until && row.locked_until > now) {
    const retry = Math.ceil((row.locked_until.getTime() - now.getTime()) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retry, locked: true };
  }

  // Over the limit? Set a hard-lockout and reject this call.
  if (row.count > opts.max) {
    const lockUntil = new Date(now.getTime() + lockMs);
    await prisma.rateLimit.update({
      where: { key: opts.key },
      data:  { lockedUntil: lockUntil },
    });
    const retry = Math.ceil(lockMs / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retry, locked: true };
  }

  return {
    allowed: true,
    remaining: opts.max - row.count,
    retryAfterSeconds: 0,
    locked: false,
  };
}

/** Manually reset a bucket (e.g. after a successful verification). */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

// ─── Convenient policy presets ────────────────────────────────────────────────

export const POLICIES = {
  /** First-login access-code verification — 5 attempts / 15 min, then lock 30 min */
  verifyCode: { max: 5,  windowMs: 15 * 60 * 1000, lockoutMs: 30 * 60 * 1000 },
  /** Sign-in attempts per IP — 20 / 10 min */
  signIn:     { max: 20, windowMs: 10 * 60 * 1000, lockoutMs: 10 * 60 * 1000 },
  /** Invitation creation per admin — 30 / hour */
  inviteSend: { max: 30, windowMs: 60 * 60 * 1000, lockoutMs: 60 * 60 * 1000 },
  /** Access requests per IP — 5 / hour (the public-facing "request access" form) */
  accessRequest: { max: 5, windowMs: 60 * 60 * 1000, lockoutMs: 60 * 60 * 1000 },
  /** Generic admin write operations per session — 100 / min (very lenient, just stops runaway scripts) */
  adminWrite: { max: 100, windowMs: 60 * 1000, lockoutMs: 60 * 1000 },
} as const;

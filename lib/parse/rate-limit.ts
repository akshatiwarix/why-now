/**
 * A fixed-window limiter held in module memory.
 *
 * Enough for a demo behind a single function instance, and honest about what
 * it is: process-local, so a scaled-out deployment gets one window per
 * instance. The alternative — a shared store — is infrastructure this project
 * does not have and does not need to demonstrate anything it claims.
 */

export type RateLimitResult = {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetInSeconds: number;
};

export const LIMIT = 5;
export const WINDOW_MS = 60_000;

type Window = { count: number; startedAt: number };

const windows = new Map<string, Window>();

export function rateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const existing = windows.get(key);

  if (existing === undefined || now - existing.startedAt >= WINDOW_MS) {
    windows.set(key, { count: 1, startedAt: now });
    return { allowed: true, remaining: LIMIT - 1, resetInSeconds: WINDOW_MS / 1000 };
  }

  const resetInSeconds = Math.ceil((existing.startedAt + WINDOW_MS - now) / 1000);
  if (existing.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: LIMIT - existing.count, resetInSeconds };
}

/** Test seam. Never called by the app. */
export function resetRateLimits(): void {
  windows.clear();
}

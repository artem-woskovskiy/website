import { type CanActivate, type ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

interface Bucket {
  count: number;
  resetAt: number;
}

interface ThrottleOptions {
  windowMs: number;
  max: number;
  /** Logical bucket key — endpoints in the same family should share. */
  scope: string;
}

const buckets = new Map<string, Bucket>();

/**
 * In-memory sliding-window throttle for password and credential endpoints.
 *
 * Production note: this is a single-process limiter. Behind multiple
 * replicas, swap to a Redis-backed implementation (BullMQ rate-limiter or
 * `@nestjs/throttler` with the redis storage adapter). Until then, this is
 * still strictly better than no limit at all and stops trivial brute-force
 * within a single instance.
 */
export function Throttle(opts: ThrottleOptions) {
  @Injectable()
  class ThrottleGuardInner implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
      const req = ctx.switchToHttp().getRequest<FastifyRequest>();
      const ip =
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
      const key = `${opts.scope}:${ip}`;
      const now = Date.now();

      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        return true;
      }
      if (existing.count >= opts.max) {
        const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
        throw new HttpException(
          { message: 'Too many requests', retryAfter },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      existing.count += 1;
      return true;
    }
  }
  return ThrottleGuardInner;
}

/** Manual sweep so the map cannot grow unbounded under attack. */
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}, 60_000).unref?.();

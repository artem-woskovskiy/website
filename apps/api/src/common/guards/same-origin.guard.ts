import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Origin / Referer enforcement on cookie-authenticated mutating endpoints.
 *
 * Cookies use sameSite=lax (needed for redirect-flows like Robokassa Result),
 * which is *not* sufficient on its own to stop cross-site POSTs. This guard
 * adds defense-in-depth: we accept a request only when its `Origin` (or
 * `Referer` fallback) host matches one of:
 *   - PUBLIC_WEB_URL  (the marketing/account/admin app)
 *   - PUBLIC_API_URL  (server-to-server local calls and health probes)
 *
 * Pure server-to-server callers (Robokassa, IDE app with Bearer token) have
 * no cookies, so they are exempted automatically.
 */
@Injectable()
export class SameOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const method = (req.method ?? 'GET').toUpperCase();
    if (SAFE_METHODS.has(method)) return true;

    // Bearer-only callers never carry our cookie auth: skip CSRF check.
    const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies ?? {};
    const usesCookieAuth = Boolean(cookies.sep_at || cookies.sep_rt);
    if (!usesCookieAuth) return true;

    const origin = (req.headers.origin as string | undefined) ?? null;
    const referer = (req.headers.referer as string | undefined) ?? null;
    const candidate = origin ?? referer;
    if (!candidate) throw new ForbiddenException('Cross-origin request blocked');

    const allowed = this.allowedOrigins();
    let host: string;
    try {
      host = new URL(candidate).origin;
    } catch {
      throw new ForbiddenException('Cross-origin request blocked');
    }
    if (!allowed.includes(host)) {
      throw new ForbiddenException('Cross-origin request blocked');
    }
    return true;
  }

  private allowedOrigins(): string[] {
    const out: string[] = [];
    for (const key of ['PUBLIC_WEB_URL', 'PUBLIC_API_URL'] as const) {
      const v = this.config.get<string>(key);
      if (!v) continue;
      try {
        out.push(new URL(v).origin);
      } catch {}
    }
    return out;
  }
}

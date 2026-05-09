import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Routing strategy:
 *   /admin/*  → top-level admin app (no locale prefix), gated by signed
 *               cookie. Auth verification itself happens in the layout/page,
 *               but the middleware short-circuits next-intl so it never
 *               injects a locale prefix.
 *   /api/*    → Next.js API/route rewrites, untouched by i18n.
 *   else      → next-intl handles locale resolution.
 *
 * Cookie validation is in the layout (Node runtime) because it relies on
 * node:crypto's `timingSafeEqual` which the Edge runtime does not expose.
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  return intlMiddleware(req);
}

export const config = {
  // Match every path except API rewrites, Next internals, and static files.
  // The /api/v1/* rewrite to the NestJS backend must NOT pass through i18n.
  matcher: ['/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)'],
};

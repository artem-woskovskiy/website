import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match every path except API rewrites, Next internals, and static files.
  // The /api/v1/* rewrite to the NestJS backend must NOT pass through i18n.
  matcher: ['/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)'],
};

import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST-only logout — deletes the signed admin cookie and redirects to the
 * login page. Restricting to POST + same-origin requirement protects against
 * one-click CSRF logout, which while low-impact is still worth blocking.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const expected = req.nextUrl.origin;
  if (origin && origin !== expected) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const res = NextResponse.redirect(new URL('/admin/login', req.url), 303);
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}

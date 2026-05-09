import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Admin-panel auth — independent of the user JWT system.
 *
 * The admin panel is gated by a single shared password (configured via
 * ADMIN_PANEL_PASSWORD). On successful login we mint a short HMAC-signed
 * cookie that contains nothing but the issued-at timestamp; absence of a
 * valid cookie redirects to /admin/login.
 *
 * Why a separate auth system? The admin panel is a parallel app — operators
 * never sign up via the web flow, so reusing the user-facing JWT system
 * would force us to maintain duplicate roles & migration paths.
 */

const COOKIE_NAME = 'sep_admin';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

const DEFAULT_USERNAME = 'admin';
const DEV_DEFAULT_PASSWORD = 'admin';

interface AdminPayload {
  iat: number;
  exp: number;
}

function getSecret(): string {
  const explicit = process.env.ADMIN_PANEL_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  const fallback = process.env.AUTH_SECRET;
  if (fallback && fallback.length >= 16) return fallback;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_PANEL_SECRET (or AUTH_SECRET) must be set to a 16+ char value in production.',
    );
  }
  return 'dev-only-admin-panel-secret-do-not-use-in-prod';
}

function getExpectedUsername(): string {
  return process.env.ADMIN_PANEL_USERNAME || DEFAULT_USERNAME;
}

function getExpectedPassword(): string {
  const fromEnv = process.env.ADMIN_PANEL_PASSWORD;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_PANEL_PASSWORD must be set in production.');
  }
  return DEV_DEFAULT_PASSWORD;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Still do a fixed-time comparison against `bb` to avoid leaking length.
    timingSafeEqual(bb, bb);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function checkCredentials(username: string, password: string): boolean {
  const userOk = safeEqual(username, getExpectedUsername());
  const passOk = safeEqual(password, getExpectedPassword());
  return userOk && passOk;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function issueAdminCookieValue(): { value: string; maxAge: number } {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminPayload = { iat: now, exp: now + COOKIE_MAX_AGE_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = sign(encoded);
  return { value: `${encoded}.${sig}`, maxAge: COOKIE_MAX_AGE_SECONDS };
}

export function verifyAdminCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  const dot = value.indexOf('.');
  if (dot <= 0) return false;
  const encoded = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(encoded);
  let sigOk = false;
  try {
    sigOk = timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
  if (!sigOk) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AdminPayload;
    if (typeof payload.exp !== 'number') return false;
    return payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

/**
 * Helper for server components: redirects to /admin/login if the cookie is
 * missing or invalid. Returns silently otherwise.
 */
export async function requireAdminSession(): Promise<void> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!verifyAdminCookieValue(value)) redirect('/admin/login');
}

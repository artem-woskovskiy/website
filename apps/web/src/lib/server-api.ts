import { cookies, headers } from 'next/headers';

/**
 * Server-only fetch helper that calls the NestJS API directly (skipping the rewrite),
 * forwarding the user's cookies so JwtAuthGuard works on the server.
 *
 * Use this from React Server Components.
 */
const SERVER_API_BASE = process.env.PUBLIC_API_URL
  ? `${process.env.PUBLIC_API_URL}/api`
  : 'http://localhost:4000/api';

export async function serverFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T | null; status: number }> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const reqHeaders = new Headers(init.headers);
  reqHeaders.set('cookie', cookieStore.toString());
  const fwd = headerStore.get('user-agent');
  if (fwd) reqHeaders.set('user-agent', fwd);
  if (init.body && !reqHeaders.has('content-type'))
    reqHeaders.set('content-type', 'application/json');

  const res = await fetch(`${SERVER_API_BASE}${path}`, {
    ...init,
    headers: reqHeaders,
    cache: 'no-store',
  });
  if (!res.ok) {
    return { data: null, status: res.status };
  }
  if (res.status === 204) return { data: null, status: res.status };
  return { data: (await res.json()) as T, status: res.status };
}

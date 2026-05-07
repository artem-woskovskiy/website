/**
 * Browser-side fetch wrapper for the NestJS API.
 *
 * Server components should use `serverFetch` from `./server-api.ts` instead —
 * it forwards the user's HTTP-only cookies via `next/headers`.
 */

const API_BASE = '/api/v1';

export type ApiOpts = Omit<RequestInit, 'body'> & { body?: unknown; raw?: boolean };

async function call<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(opts.headers);
  if (opts.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: 'include',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }
    const message = (body as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
    const err = new Error(typeof message === 'string' ? message : 'Request failed') as Error & {
      status: number;
      body: unknown;
    };
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (opts.raw) return (await res.text()) as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, opts?: ApiOpts) => call<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: ApiOpts) =>
    call<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: ApiOpts) =>
    call<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: ApiOpts) => call<T>(path, { ...opts, method: 'DELETE' }),
};

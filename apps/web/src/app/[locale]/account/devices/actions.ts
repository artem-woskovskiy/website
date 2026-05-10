'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Revoke a single OAuth device session. Called from `/account/devices`.
 * IDOR is checked server-side: the API only revokes sessions whose
 * `userId` matches the JWT subject.
 */
export async function revokeDeviceAction(formData: FormData) {
  const sessionId = String(formData.get('session_id') ?? '');
  if (!sessionId) return { ok: false as const, error: 'invalid_request' };

  const apiBase = process.env.PUBLIC_API_URL
    ? `${process.env.PUBLIC_API_URL}/api`
    : 'http://localhost:4000/api';
  const cookieStore = await cookies();
  const headerStore = await headers();

  const res = await fetch(`${apiBase}/oauth/devices/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: {
      cookie: cookieStore.toString(),
      'user-agent': headerStore.get('user-agent') ?? 'sepaito-web',
    },
    cache: 'no-store',
  });
  if (!res.ok && res.status !== 204) {
    return { ok: false as const, error: `http_${res.status}` };
  }
  revalidatePath('/account/devices');
  return { ok: true as const };
}

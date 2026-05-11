'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

/**
 * Server action invoked by the "Open" / "Cancel" buttons on the consent
 * screen. On approval, hits the API to mint a one-shot authorization code,
 * then redirects the browser to the IDE's custom URL scheme so the OS can
 * hand the code off to the desktop app.
 */
const inputSchema = z.object({
  decision: z.enum(['approve', 'deny']),
  client_id: z.enum(['ide-desktop', 'cli', 'vscode-ext']),
  redirect_uri: z.string().min(1),
  scope: z.string().default(''),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal('S256'),
  state: z.string().optional(),
  device_name: z.string().max(120).optional(),
  platform: z.string().max(60).optional(),
});

export async function authorizeDeviceAction(formData: FormData) {
  const parsed = inputSchema.safeParse({
    decision: formData.get('decision'),
    client_id: formData.get('client_id'),
    redirect_uri: formData.get('redirect_uri'),
    scope: formData.get('scope') ?? '',
    code_challenge: formData.get('code_challenge'),
    code_challenge_method: formData.get('code_challenge_method'),
    state: formData.get('state') ?? undefined,
    device_name: formData.get('device_name') ?? undefined,
    platform: formData.get('platform') ?? undefined,
  });
  if (!parsed.success) {
    redirect('/oauth/error?reason=invalid_request');
  }
  const { data } = parsed;

  if (data.decision === 'deny') {
    const url = new URL(data.redirect_uri);
    url.searchParams.set('error', 'access_denied');
    if (data.state) url.searchParams.set('state', data.state);
    redirect(url.toString());
  }

  const cookieStore = await import('next/headers').then((m) => m.cookies());
  const cookies = await cookieStore;
  const headerStore = await headers();
  const apiBase = process.env.PUBLIC_API_URL
    ? `${process.env.PUBLIC_API_URL}/api`
    : 'http://localhost:4000/api';

  const res = await fetch(`${apiBase}/oauth/authorize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: cookies.toString(),
      'user-agent': headerStore.get('user-agent') ?? 'sepaito-web',
    },
    cache: 'no-store',
    body: JSON.stringify({
      client_id: data.client_id,
      redirect_uri: data.redirect_uri,
      scope: data.scope.split(/[ +]/).filter(Boolean),
      code_challenge: data.code_challenge,
      code_challenge_method: data.code_challenge_method,
      device_name: data.device_name ?? null,
      platform: data.platform ?? null,
    }),
  });

  if (!res.ok) {
    redirect(
      `/oauth/error?reason=${encodeURIComponent(
        res.status === 401 ? 'login_required' : res.status === 403 ? 'email_not_verified' : 'server_error',
      )}`,
    );
  }
  const { code } = (await res.json()) as { code: string };

  const target = new URL(data.redirect_uri);
  target.searchParams.set('code', code);
  if (data.state) target.searchParams.set('state', data.state);
  redirect(target.toString());
}

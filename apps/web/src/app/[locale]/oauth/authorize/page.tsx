import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { oauthAuthorizeQuerySchema, OAUTH_SCOPE_LABELS } from '@sepaito/shared';
import { getCurrentUser } from '@/lib/auth-server';
import { detectDeviceFromHeaders, fetchOAuthClient } from '@/lib/oauth-server';
import { ConsentCard } from './_components/consent-card';
import type { Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Authorize device' };

type Search = Record<string, string | string[] | undefined>;

/**
 * OAuth 2.0 Authorization endpoint (Authorization Code + PKCE).
 *
 *   IDE  --opens-->  https://sepaito.ai/oauth/authorize?client_id=...
 *
 * On this page we:
 *   1. parse + validate the query string (Zod),
 *   2. require an authenticated, email-verified user (redirect to /sign-in otherwise),
 *   3. resolve the OAuth client metadata (name, allowed scopes, redirect URIs),
 *   4. render the consent UI. Submitting the form invokes a server action
 *      that mints an authorization code and redirects to the IDE's custom
 *      URL scheme (e.g. `sepaito://oauth/callback?code=...`).
 */
export default async function OAuthAuthorizePage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const search = await props.searchParams;

  const parsed = oauthAuthorizeQuerySchema.safeParse(search);
  if (!parsed.success) {
    redirect('/oauth/error?reason=invalid_request');
  }
  const q = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    const next = `/${locale}/oauth/authorize?${new URLSearchParams(toStringRecord(search)).toString()}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }
  if (!user.emailVerifiedAt) {
    redirect('/oauth/error?reason=email_not_verified');
  }

  const client = await fetchOAuthClient(q.client_id);
  if (!client) redirect('/oauth/error?reason=invalid_client');
  if (!client.redirectUris.includes(q.redirect_uri)) {
    redirect('/oauth/error?reason=invalid_redirect_uri');
  }

  // Intersect requested scopes with what the client is allowed to ask for.
  const allowed = new Set(client.allowedScopes);
  const grantedScopes = (
    q.scope.length > 0
      ? q.scope.filter((s) => allowed.has(s))
      : client.allowedScopes
  ) as Array<keyof typeof OAUTH_SCOPE_LABELS>;
  if (grantedScopes.length === 0) {
    redirect('/oauth/error?reason=invalid_scope');
  }

  const device = await detectDeviceFromHeaders();
  const tConsent = await getTranslations('oauth.consent');

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-xl items-center justify-center px-4 py-12">
      <ConsentCard
        client={{
          name: client.name,
          description: client.description,
          iconUrl: client.iconUrl,
        }}
        user={{ email: user.email, name: user.name }}
        device={{
          name: device.deviceName,
          platform: device.platform,
          ip: null,
          geo: null,
        }}
        scopes={grantedScopes.map((id) => ({
          id,
          label: OAUTH_SCOPE_LABELS[id][locale] ?? OAUTH_SCOPE_LABELS[id].en,
        }))}
        hidden={{
          client_id: q.client_id,
          redirect_uri: q.redirect_uri,
          scope: grantedScopes.join(' '),
          code_challenge: q.code_challenge,
          code_challenge_method: q.code_challenge_method,
          state: q.state,
          device_name: device.deviceName ?? undefined,
          platform: device.platform ?? undefined,
        }}
      />
      <span className="sr-only">{tConsent('title', { app: client.name })}</span>
    </main>
  );
}

function toStringRecord(s: Search): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === 'string') out[k] = v;
    else if (Array.isArray(v) && typeof v[0] === 'string') out[k] = v[0];
  }
  return out;
}

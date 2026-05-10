import { headers } from 'next/headers';
import { serverFetch } from './server-api';

/**
 * Public client metadata returned by `GET /api/oauth/clients/:clientId`.
 * Loaded on the consent screen to render the human-facing client name.
 */
export interface OAuthClientPublic {
  clientId: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  redirectUris: string[];
  allowedScopes: string[];
  requirePkce: boolean;
}

export async function fetchOAuthClient(clientId: string): Promise<OAuthClientPublic | null> {
  const { data } = await serverFetch<OAuthClientPublic>(
    `/oauth/clients/${encodeURIComponent(clientId)}`,
  );
  return data;
}

/**
 * Active device session as displayed on /account/devices.
 */
export interface OAuthDeviceSession {
  id: string;
  clientId: string;
  clientName: string;
  deviceName: string | null;
  platform: string | null;
  ip: string | null;
  geoCountry: string | null;
  userAgent: string | null;
  scope: string[];
  lastSeenAt: string | null;
  createdAt: string;
  expiresAt: string;
}

export async function fetchOAuthDevices(): Promise<OAuthDeviceSession[]> {
  const { data } = await serverFetch<OAuthDeviceSession[]>('/oauth/devices');
  return data ?? [];
}

/**
 * Best-effort device info parsed from the current request headers so the
 * consent screen can show "MacBook · macOS · ru-RU" without the IDE having
 * to send it. The IDE can still override via `device_name` query param.
 */
export async function detectDeviceFromHeaders(): Promise<{
  platform: string | null;
  deviceName: string | null;
}> {
  const h = await headers();
  const ua = h.get('user-agent') ?? '';
  const platform = guessPlatform(ua);
  return {
    platform,
    deviceName: platform ? `Browser on ${platform}` : null,
  };
}

function guessPlatform(ua: string): string | null {
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iOS/i.test(ua)) return 'iOS';
  return null;
}

/**
 * Build the deep-link the OS will hand off to the IDE after the user clicks
 * "Open". State is forwarded unchanged so the IDE can correlate the response
 * with the original PKCE verifier it generated.
 */
export function buildRedirectUrl(args: {
  redirectUri: string;
  code: string;
  state?: string;
}): string {
  const url = new URL(args.redirectUri);
  url.searchParams.set('code', args.code);
  if (args.state) url.searchParams.set('state', args.state);
  return url.toString();
}

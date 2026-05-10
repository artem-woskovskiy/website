import { z } from 'zod';

// First-party OAuth client identifiers. Whitelist; anything not in this enum
// is rejected by the authorization endpoint before touching the DB.
export const oauthClientIdSchema = z.enum(['ide-desktop', 'cli', 'vscode-ext']);
export type OAuthClientId = z.infer<typeof oauthClientIdSchema>;

// Scopes the IDE may request. Authorization endpoint intersects this with
// the client's `allowedScopes` column before showing the consent screen.
export const oauthScopeSchema = z.enum([
  'profile',
  'projects.read',
  'projects.write',
  'usage.read',
  'usage.write',
]);
export type OAuthScope = z.infer<typeof oauthScopeSchema>;

// Human-readable scope copy. Used to render the consent screen scope list.
// Keep keys in sync with `oauthScopeSchema`.
export const OAUTH_SCOPE_LABELS = {
  profile: { en: 'Read your profile (name, email, plan)', ru: 'Читать ваш профиль', pl: 'Czytać Twój profil' },
  'projects.read': {
    en: 'Read your workspaces and projects',
    ru: 'Читать рабочие пространства',
    pl: 'Czytać Twoje projekty',
  },
  'projects.write': {
    en: 'Create and modify workspaces',
    ru: 'Создавать и менять рабочие пространства',
    pl: 'Tworzyć i modyfikować projekty',
  },
  'usage.read': {
    en: 'Read your usage and quotas',
    ru: 'Видеть вашу статистику и лимиты',
    pl: 'Czytać Twoje zużycie',
  },
  'usage.write': {
    en: 'Report usage from this device',
    ru: 'Передавать статистику с этого устройства',
    pl: 'Raportować zużycie z tego urządzenia',
  },
} as const satisfies Record<OAuthScope, Record<'en' | 'ru' | 'pl', string>>;

// PKCE: RFC 7636 mandates 43–128 chars and URL-safe base64. We accept S256 only.
const codeChallengeSchema = z
  .string()
  .min(43)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, 'code_challenge must be base64url');

const codeVerifierSchema = z
  .string()
  .min(43)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, 'code_verifier must be base64url');

// Query params accepted by GET /oauth/authorize.
export const oauthAuthorizeQuerySchema = z.object({
  client_id: oauthClientIdSchema,
  redirect_uri: z.string().url().or(z.string().regex(/^sepaito:\/\//)),
  response_type: z.literal('code'),
  scope: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(/[ +]/).filter(Boolean) : []))
    .pipe(z.array(oauthScopeSchema).max(8)),
  state: z.string().min(8).max(256).optional(),
  code_challenge: codeChallengeSchema,
  code_challenge_method: z.literal('S256'),
});
export type OAuthAuthorizeQuery = z.infer<typeof oauthAuthorizeQuerySchema>;

// Body accepted by POST /api/oauth/token in the authorization_code path.
export const oauthTokenCodeSchema = z.object({
  grant_type: z.literal('authorization_code'),
  client_id: oauthClientIdSchema,
  code: z.string().min(20).max(256),
  code_verifier: codeVerifierSchema,
  redirect_uri: z.string().url().or(z.string().regex(/^sepaito:\/\//)),
});

// Refresh path.
export const oauthTokenRefreshSchema = z.object({
  grant_type: z.literal('refresh_token'),
  client_id: oauthClientIdSchema,
  refresh_token: z.string().min(10).max(512),
});

export const oauthTokenSchema = z.discriminatedUnion('grant_type', [
  oauthTokenCodeSchema,
  oauthTokenRefreshSchema,
]);
export type OAuthTokenRequest = z.infer<typeof oauthTokenSchema>;

// Revocation per RFC 7009.
export const oauthRevokeSchema = z.object({
  client_id: oauthClientIdSchema,
  token: z.string().min(10).max(512),
  token_type_hint: z.enum(['access_token', 'refresh_token']).optional(),
});

// Successful token response (RFC 6749 §5.1).
export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
  };
}

// RFC 6749 §5.2 error codes we may return.
export type OAuthErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope'
  | 'access_denied'
  | 'server_error'
  | 'temporarily_unavailable'
  | 'email_not_verified';

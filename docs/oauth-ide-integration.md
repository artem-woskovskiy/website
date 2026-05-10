# OAuth device flow — IDE integration guide

This document is the contract between the **Sepaito website** (this repo) and
**any first-party Sepaito client** (the Sepaito Desktop IDE, future CLI,
future VS Code extension).

It targets the desktop IDE first. The web side of the flow ships in this
repo and is fully testable locally; the IDE side is your responsibility and
this document tells you exactly what to implement.

---

## The flow

```
┌──────────┐                         ┌──────────────┐                ┌──────────┐
│   IDE    │   1. open browser       │   Browser    │   2. consent   │ Website  │
│ (native) │ ──────────────────────► │  (default)   │ ─────────────► │ Next.js  │
│          │   sepaito://oauth/cb◄── │              │ ◄───────────── │  + API   │
└──────────┘                         └──────────────┘                └──────────┘
     │                                                                     ▲
     │  3. POST /v1/oauth/token  (code + code_verifier)                    │
     └─────────────────────────────────────────────────────────────────────┘
                       4. access_token + refresh_token
```

1. The IDE generates a PKCE pair and opens the system browser at
   `https://sepaito.ai/oauth/authorize?…`.
2. The user signs in on the website (or is already signed in), reviews the
   consent screen, and clicks **Open in Sepaito Desktop**.
3. The website mints a one-shot authorization code and redirects the
   browser to `sepaito://oauth/callback?code=…&state=…`. The OS routes
   the URL to the registered IDE binary.
4. The IDE exchanges the code for tokens at the API.

---

## 1. Register the custom URL scheme

The IDE must register `sepaito://` as a protocol handler with the OS so the
browser can hand off the redirect URL to the desktop binary.

### macOS — `Info.plist`

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>ai.sepaito.oauth</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>sepaito</string>
    </array>
  </dict>
</array>
```

Listen for the URL with `NSAppleEventManager` (AppKit) or the modern
`onOpenURL` modifier in SwiftUI. In Electron you get the URL through the
`open-url` event.

### Windows — registry

Run once on install. `%1` is replaced by the OS with the full
`sepaito://...` URL.

```reg
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\sepaito]
@="URL:Sepaito Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\sepaito\shell]

[HKEY_CLASSES_ROOT\sepaito\shell\open]

[HKEY_CLASSES_ROOT\sepaito\shell\open\command]
@="\"C:\\Program Files\\Sepaito\\Sepaito.exe\" \"%1\""
```

In Electron, prefer `app.setAsDefaultProtocolClient('sepaito')` instead of
editing the registry by hand.

### Linux — `.desktop` file

Drop into `~/.local/share/applications/sepaito.desktop` (or the system-wide
`/usr/share/applications/sepaito.desktop`) and update the desktop database
with `update-desktop-database`.

```ini
[Desktop Entry]
Type=Application
Name=Sepaito
Exec=/opt/sepaito/sepaito %u
Icon=sepaito
Terminal=false
StartupWMClass=Sepaito
MimeType=x-scheme-handler/sepaito;
Categories=Development;IDE;
```

```sh
xdg-mime default sepaito.desktop x-scheme-handler/sepaito
```

---

## 2. Generate PKCE + open the browser

PKCE protects the authorization code from being stolen by other apps on the
machine. Per [RFC 7636 §4.6](https://datatracker.ietf.org/doc/html/rfc7636)
the website only stores `BASE64URL(SHA256(code_verifier))` and validates it
against the verifier on the `/oauth/token` exchange.

```ts
import { randomBytes, createHash } from 'node:crypto';

function base64url(buf: Buffer) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const codeVerifier = base64url(randomBytes(64));        // 43–128 chars
const codeChallenge = base64url(
  createHash('sha256').update(codeVerifier).digest(),
);
const state = base64url(randomBytes(24));

const u = new URL('https://sepaito.ai/oauth/authorize');
u.searchParams.set('client_id', 'ide-desktop');
u.searchParams.set('response_type', 'code');
u.searchParams.set('redirect_uri', 'sepaito://oauth/callback');
u.searchParams.set('scope', 'profile projects.read projects.write usage.write');
u.searchParams.set('state', state);
u.searchParams.set('code_challenge', codeChallenge);
u.searchParams.set('code_challenge_method', 'S256');

await shell.openExternal(u.toString());     // Electron
// or use `open` (macOS) / `start` (Windows) / `xdg-open` (Linux)
```

Stash `codeVerifier` and `state` in process memory until the deep-link
arrives — **never** write them to disk.

---

## 3. Exchange the code for tokens

When the OS hands back `sepaito://oauth/callback?code=…&state=…`, verify
`state` matches what you generated, then POST to the API:

```ts
const res = await fetch('https://sepaito.ai/api/oauth/token', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    client_id: 'ide-desktop',
    code,
    code_verifier: codeVerifier,
    redirect_uri: 'sepaito://oauth/callback',
  }),
});
const tokens = await res.json();
// {
//   access_token, token_type: 'Bearer', expires_in: 900,
//   refresh_token, scope, user
// }
```

The response shape is described in `packages/shared/src/schemas/oauth.ts`
(see `OAuthTokenResponse`). Persist the tokens to the OS keychain
(Keychain on macOS, Credential Manager on Windows, libsecret on Linux) —
**never** to plaintext files.

---

## 4. Refresh the access token

Access tokens expire every 15 minutes. Refresh proactively a minute before
expiry:

```ts
const res = await fetch('https://sepaito.ai/api/oauth/token', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'refresh_token',
    client_id: 'ide-desktop',
    refresh_token: previousRefreshToken,
  }),
});
```

Refresh tokens rotate on every exchange. The old token is invalidated
immediately; on a 401 from the refresh endpoint you must drop both tokens
and force the user through the consent screen again.

---

## 5. Revoke (sign out)

```ts
await fetch('https://sepaito.ai/api/oauth/revoke', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    client_id: 'ide-desktop',
    token: refreshToken,
    token_type_hint: 'refresh_token',
  }),
});
```

The website also lets the user revoke this device from
`https://sepaito.ai/account/devices`. After a revoke, the IDE must
re-prompt the user the next time it hits a 401.

---

## 6. Authenticated API calls

Send the access token as `Authorization: Bearer …` on every API call. The
JWT carries `clientId`, `scope` and `sid` so server-side handlers can scope
authorization. Example:

```ts
const res = await fetch('https://sepaito.ai/api/users/me', {
  headers: { authorization: `Bearer ${accessToken}` },
});
```

---

## 7. Local development

`packages/db/prisma/seed.ts` ships an `ide-desktop` client row with the
`sepaito://oauth/callback` redirect URI. To run the flow locally:

```sh
pnpm install
pnpm --filter @sepaito/db prisma migrate dev
pnpm --filter @sepaito/db prisma db seed
pnpm dev   # starts web on :3000 and api on :4000
```

While developing the IDE, point your client at `http://localhost:3000` for
the authorize URL and `http://localhost:4000/api` for the token endpoint.

---

## Security checklist

- **Always** use PKCE S256 (the website enforces `requirePkce` on
  `ide-desktop`).
- **Always** verify the `state` parameter you generated before consuming
  the code.
- **Never** send `client_secret` — there is none (public client).
- **Never** log `code_verifier`, `access_token`, or `refresh_token`.
- Persist tokens in the OS keychain only.
- Re-check the `redirect_uri` exactly matches what the IDE sent — the
  website rejects mismatches with `invalid_grant`.
- Drop both tokens on any 401 from `/oauth/token` refresh and re-run the
  consent flow.

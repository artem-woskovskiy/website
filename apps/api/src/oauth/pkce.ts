import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Verify a PKCE S256 code_verifier against a stored code_challenge.
 *
 * Per RFC 7636 §4.6: `code_challenge = BASE64URL(SHA256(code_verifier))`
 *
 * Uses a timing-safe comparison to avoid leaking information via
 * `===` on a (sufficiently long) base64url string.
 */
export function verifyPkceS256(codeVerifier: string, storedChallenge: string): boolean {
  const computed = createHash('sha256').update(codeVerifier).digest('base64url');
  if (computed.length !== storedChallenge.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(storedChallenge));
}

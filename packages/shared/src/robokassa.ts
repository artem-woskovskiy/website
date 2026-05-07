import { createHash } from 'node:crypto';

/**
 * Robokassa request signature for the *initiate* (redirect to payment) URL.
 *
 *   md5( MerchantLogin : OutSum : InvId : Password1 [ : Shp_xxx=value ... ] )
 *
 * Returns an UPPERCASE md5 hex string, as required by Robokassa.
 */
export function buildInitSignature(args: {
  merchantLogin: string;
  outSum: string;
  invId: string | number;
  password1: string;
  shp?: Record<string, string | number>;
}): string {
  const { merchantLogin, outSum, invId, password1, shp = {} } = args;
  const shpParts = Object.keys(shp)
    .sort()
    .map((k) => `${k}=${shp[k]}`);
  const raw = [merchantLogin, outSum, String(invId), password1, ...shpParts].join(':');
  return md5Upper(raw);
}

/**
 * Robokassa Result-URL signature (server callback).
 *
 *   md5( OutSum : InvId : Password2 [ : Shp_xxx=value ... ] )
 */
export function verifyResultSignature(args: {
  outSum: string;
  invId: string | number;
  password2: string;
  signatureValue: string;
  shp?: Record<string, string | number>;
}): boolean {
  const { outSum, invId, password2, signatureValue, shp = {} } = args;
  const shpParts = Object.keys(shp)
    .sort()
    .map((k) => `${k}=${shp[k]}`);
  const raw = [outSum, String(invId), password2, ...shpParts].join(':');
  const expected = md5Upper(raw);
  return constantTimeEqual(expected, signatureValue.toUpperCase());
}

/**
 * Build the full Robokassa redirect URL.
 *
 * In real production: https://auth.robokassa.ru/Merchant/Index.aspx
 * For the stub we point this at our own /api/payments/robokassa/stub endpoint
 * so the developer never leaves localhost.
 */
export function buildInitUrl(args: {
  baseUrl: string; // robokassa endpoint OR our stub
  merchantLogin: string;
  outSum: string;
  invId: string | number;
  description: string;
  signature: string;
  isTest?: boolean;
  culture?: 'ru' | 'en';
  shp?: Record<string, string | number>;
}): string {
  const params = new URLSearchParams({
    MerchantLogin: args.merchantLogin,
    OutSum: args.outSum,
    InvId: String(args.invId),
    Description: args.description,
    SignatureValue: args.signature,
    Culture: args.culture ?? 'en',
  });
  if (args.isTest) params.set('IsTest', '1');
  for (const [k, v] of Object.entries(args.shp ?? {})) {
    params.set(k, String(v));
  }
  return `${args.baseUrl}?${params.toString()}`;
}

function md5Upper(s: string): string {
  return createHash('md5').update(s, 'utf8').digest('hex').toUpperCase();
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

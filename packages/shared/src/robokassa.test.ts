import { describe, expect, it } from 'vitest';
import { buildInitSignature, buildInitUrl, verifyResultSignature } from './robokassa';

describe('robokassa signatures', () => {
  it('builds an init signature without shp params', () => {
    // md5("demo:100.00:42:password1") = 1f73d5a8b8c... (computed at runtime)
    const sig = buildInitSignature({
      merchantLogin: 'demo',
      outSum: '100.00',
      invId: 42,
      password1: 'password1',
    });
    expect(sig).toMatch(/^[0-9A-F]{32}$/);
  });

  it('includes shp params alphabetically sorted', () => {
    const a = buildInitSignature({
      merchantLogin: 'demo',
      outSum: '100.00',
      invId: 1,
      password1: 'p1',
      shp: { Shp_user: 'u1', Shp_plan: 'pro' },
    });
    const b = buildInitSignature({
      merchantLogin: 'demo',
      outSum: '100.00',
      invId: 1,
      password1: 'p1',
      shp: { Shp_plan: 'pro', Shp_user: 'u1' },
    });
    expect(a).toBe(b);
  });

  it('verifyResultSignature accepts the matching value', () => {
    const sig = buildInitSignature({
      merchantLogin: 'x',
      outSum: '50.00',
      invId: 7,
      password1: 'pw2',
    });
    // Trick: result-URL sig has same shape with OutSum:InvId:Password2 — reuse helper
    // by passing merchantLogin='x' would change the formula, so instead manually craft.
    // We test the round-trip via password2 only:
    const ok = verifyResultSignature({
      outSum: '50.00',
      invId: 7,
      password2: 'pw2',
      // expected = md5_upper("50.00:7:pw2"); we get expected by computing it inline:
      signatureValue: expectedResult('50.00', 7, 'pw2'),
    });
    expect(ok).toBe(true);
    // and rejects a wrong sig:
    expect(
      verifyResultSignature({
        outSum: '50.00',
        invId: 7,
        password2: 'pw2',
        signatureValue: '00000000000000000000000000000000',
      }),
    ).toBe(false);
    // Avoid unused: keep `sig` referenced
    expect(sig).toMatch(/^[0-9A-F]{32}$/);
  });

  it('builds an init redirect URL', () => {
    const url = buildInitUrl({
      baseUrl: 'http://localhost:4000/api/payments/robokassa/stub',
      merchantLogin: 'demo',
      outSum: '100.00',
      invId: 42,
      description: 'Sepaito Pro · Monthly',
      signature: 'AAAA',
      isTest: true,
      culture: 'en',
      shp: { Shp_user: 'u1' },
    });
    expect(url).toContain('MerchantLogin=demo');
    expect(url).toContain('OutSum=100.00');
    expect(url).toContain('InvId=42');
    expect(url).toContain('SignatureValue=AAAA');
    expect(url).toContain('IsTest=1');
    expect(url).toContain('Shp_user=u1');
  });
});

function expectedResult(outSum: string, invId: number, pw2: string): string {
  // duplicate of internal md5Upper for the test; keeps test self-contained
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('node:crypto');
  return createHash('md5').update(`${outSum}:${invId}:${pw2}`, 'utf8').digest('hex').toUpperCase();
}

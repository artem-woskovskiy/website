import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  experimental: {
    typedRoutes: false,
  },
  // Keep these in the Node runtime — they bundle native bindings (Prisma,
  // ioredis, bullmq) that webpack can't safely tree-shake.
  serverExternalPackages: ['@prisma/client', '@sepaito/db', 'ioredis', 'bullmq'],
  async rewrites() {
    const api = process.env.PUBLIC_API_URL ?? 'http://localhost:4000';
    return [{ source: '/api/v1/:path*', destination: `${api}/api/:path*` }];
  },
  async headers() {
    // Security headers applied to every response served by Next.
    // CSP is intentionally permissive for first-party scripts (Next/RSC inline)
    // but locks down framing, MIME-sniffing, and referrer leakage.
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);

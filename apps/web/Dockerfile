# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────────────
# 1. base — node + pnpm
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20.18-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ─────────────────────────────────────────────────────────────────────────────
# 2. deps
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json biome.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch && pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# 3. build — Next.js standalone output
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /repo

# Next.js bakes rewrite destinations into the routes manifest at build time,
# so PUBLIC_API_URL must be set HERE, not just at runtime. Defaults to the
# docker-compose service name; override with `--build-arg PUBLIC_API_URL=...`
# if you're running the web container against a different API host.
ARG PUBLIC_API_URL=http://api:4000
ENV PUBLIC_API_URL=$PUBLIC_API_URL

COPY tsconfig.base.json ./
COPY packages packages
COPY apps/web apps/web

RUN pnpm --filter @sepaito/db generate
RUN pnpm --filter @sepaito/shared build
RUN pnpm --filter @sepaito/db build
# next.config.mjs sets output: 'standalone', so we get a self-contained server.js
RUN pnpm --filter @sepaito/web build

# Fix Prisma for standalone: copy the generated client into the exact pnpm-style path
RUN mkdir -p apps/web/.next/standalone/node_modules/.pnpm/@prisma+client@6.1.0_prisma@6.1.0/node_modules/.prisma \
    && cp -R node_modules/.pnpm/@prisma+client@6.1.0_prisma@6.1.0/node_modules/.prisma/* \
             apps/web/.next/standalone/node_modules/.pnpm/@prisma+client@6.1.0_prisma@6.1.0/node_modules/.prisma/

# ─────────────────────────────────────────────────────────────────────────────
# 4. runtime — only the standalone bundle
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20.18-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update -y && apt-get install -y --no-install-recommends ca-certificates dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 sepaito \
  && useradd --system --uid 1001 --gid sepaito sepaito

WORKDIR /app

COPY --from=build /repo/apps/web/.next/standalone/ ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

USER sepaito
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]

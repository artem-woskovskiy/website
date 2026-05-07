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
# 2. deps — install workspace deps once
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
# 3. build — generate prisma + compile nest
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /repo

COPY tsconfig.base.json ./
COPY packages packages
COPY apps/api apps/api

RUN pnpm --filter @sepaito/db generate
RUN pnpm --filter @sepaito/shared build
RUN pnpm --filter @sepaito/db build
RUN pnpm --filter @sepaito/api build

# Prune dev deps so the runtime image stays small. After deploy, regenerate
# the Prisma client inside the pruned tree (deploy strips the generated
# engine because @prisma/client postinstall has no schema to generate from).
RUN pnpm --filter @sepaito/api --prod deploy /out/api
# pnpm deploy reinstalls prod deps from scratch which strips the generated
# Prisma client (since the API package itself has no `prisma` schema field).
# Copy the schema for visibility, and the generated client over the pruned stub.
RUN cp -R /repo/packages/db/prisma /out/api/prisma \
  && rm -rf /out/api/node_modules/.pnpm/@prisma+client*/node_modules/.prisma \
  && cp -R /repo/node_modules/.pnpm/@prisma+client@6.1.0_prisma@6.1.0/node_modules/.prisma \
        /out/api/node_modules/.pnpm/@prisma+client@6.1.0_prisma@6.1.0/node_modules/.prisma

# ─────────────────────────────────────────────────────────────────────────────
# 4. runtime — minimal node image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20.18-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=4000

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 sepaito \
  && useradd --system --uid 1001 --gid sepaito sepaito

WORKDIR /app
COPY --from=build /out/api/package.json ./package.json
COPY --from=build /out/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/packages/db/prisma ./prisma

USER sepaito
EXPOSE 4000 50051

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

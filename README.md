# Sepaito.ai — web platform

Marketing site, auth, profile, admin, and a REST + gRPC subscription API for the **Sepaito** AI Agents IDE.

This is a **TypeScript-only**, **monorepo** (pnpm workspaces + Turborepo) with:

| App / Package          | Stack                                              | Purpose                                          |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------ |
| `apps/web`             | Next.js 15 (App Router) · React 19 · Tailwind v4   | Marketing, auth UI, profile, admin panel         |
| `apps/api`             | NestJS 10 · Fastify · Prisma · BullMQ · gRPC       | REST + gRPC backend                              |
| `packages/db`          | Prisma 6 · Postgres 18                             | Schema, migrations, seed                         |
| `packages/shared`      | Zod                                                | Schemas + Robokassa utilities reused on both ends|

---

## Quick start (Docker — recommended)

The whole stack runs in containers. You don't need Node, pnpm, Postgres or
Redis on your host — just Docker.

```bash
docker compose up --build -d
```

That starts: Postgres 18, PgBouncer, Redis, a one-shot migration + seed job,
the NestJS API and the Next.js web app. First boot takes ~2–3 min while
images compile; subsequent runs reuse the build cache.

Tear it down with `docker compose down` (add `-v` to also wipe the database
volumes).

## Prerequisites — local dev (without Docker)

If you'd rather run Node directly:

- Node.js **>= 20.11**
- pnpm **9.15.x** (`corepack enable && corepack prepare pnpm@9.15.1 --activate`)
- Docker (for Postgres 18, PgBouncer, Redis only)

```bash
# 1. install
pnpm install

# 2. boot Postgres 18 + PgBouncer + Redis
pnpm infra:up

# 3. configure env
cp .env.example .env
# edit .env if you want — defaults work for local dev

# 4. database
pnpm db:generate
pnpm db:migrate
pnpm db:seed       # creates 3 plans + bootstraps an admin user (ADMIN_BOOTSTRAP_EMAIL)

# 5. run everything
pnpm dev
```

| Service          | URL                                       |
| ---------------- | ----------------------------------------- |
| Marketing / app  | http://localhost:3000                     |
| REST API         | http://localhost:4000/api                 |
| Health check     | http://localhost:4000/health              |
| gRPC (IDE)       | `0.0.0.0:50051` (proto: `apps/api/src/grpc/proto/sepaito.proto`) |
| Postgres         | `localhost:5432` (raw) / `localhost:6432` (PgBouncer) |
| Redis            | `localhost:6379`                          |

The seeded admin user is created with the email in `ADMIN_BOOTSTRAP_EMAIL`. The first time it signs up via the web form, that account will already have `role=ADMIN`.

### Docker — useful commands

```bash
docker compose up --build -d        # build + run everything detached
docker compose logs -f api          # tail one service
docker compose ps                   # see status of all services
docker compose down                 # stop everything (keeps DB volume)
docker compose down -v              # stop + wipe DB + Redis volumes
docker compose run --rm migrate sh  # interactive shell in the migrate image
```

Web → API rewrites: the web container ships with `PUBLIC_API_URL=http://api:4000`
baked into Next's routes manifest at build time. If you point it at a different
API host, rebuild the web image with:

```bash
docker compose build --build-arg PUBLIC_API_URL=https://api.example.com web
```

---

## Architecture

```
┌────────────────────┐     HTTPS / cookies     ┌────────────────────────┐
│  apps/web (Next 15)│ ─────────────────────▶  │  apps/api (NestJS)     │
│  marketing + UI    │                         │  REST  /api/*          │
└────────────────────┘                         │  gRPC  :50051          │
                                               └────────────────────────┘
                                                  │            │
                                ┌─────────────────┘            └─────────────┐
                                ▼                                            ▼
                        ┌─────────────┐  jobs              ┌────────────────────┐
                        │ Postgres 18 │◀────BullMQ────▶    │ Redis 7            │
                        │ via PgBouncer│                    │                    │
                        └─────────────┘                    └────────────────────┘
```

The IDE app (built separately) authenticates over gRPC with an API key generated in **Account → Models & API**, and the web frontend authenticates with HTTP-only cookies.

---

## What's implemented

### Marketing
- Home with hero, IDE mock, animated stat odometer, sticky-pin feature reel, themes strip, CTA
- About page (vibrant, mesh-gradient hero + manifesto + timeline + values)
- Pricing (driven by DB plans)
- Legal: Terms, Privacy

### Auth
- Email + password sign-up (Argon2id), sign-in, sign-out
- Email verification + password reset (BullMQ `email` queue logs to console — swap to Resend in prod)
- JWT access (15m) + opaque refresh token (30d, rotating) in HTTP-only cookies
- Sessions table; revoke individual sessions from the profile

### Profile
- Account (name, locale, sign out)
- Models & API: create / revoke API keys for the IDE (raw key shown once)
- Billing: current plan, invoices, cancel-at-period-end
- Devices: active sessions

### Admin (`role=ADMIN`)
- Overview: user count, active subs, total revenue
- Users list (search, paginate) + user detail
- Payments list

### Payments — Robokassa stub
- `POST /api/payments/checkout` builds a signed redirect URL
- `GET  /api/payments/robokassa/stub` renders a tiny "fake Robokassa" page
- `POST /api/payments/robokassa/result` verifies the password-2 signature and grants/extends the subscription
- `GET  /api/payments/robokassa/success` redirects to `/account/billing?payment=success`
- `GET  /api/payments/robokassa/fail`    redirects to `/pricing?payment=failed`

The signature math (`buildInitSignature`, `verifyResultSignature`) lives in `packages/shared/src/robokassa.ts` and is identical to production Robokassa — swapping in real merchant credentials is a one-line change in `RobokassaStubProvider`.

### IDE integration
- gRPC service `sepaito.SubscriptionService` with `Validate(api_key, install_id, platform)` and `Heartbeat(api_key, install_id)`
- Hobby plan is the default fallback when no paid sub exists
- Each Validate call upserts a Device (so the user can see which install IDs are reaching the IDE)

---

## Workspace scripts

```bash
pnpm dev              # run web + api in parallel
pnpm build            # build all
pnpm lint             # biome lint
pnpm typecheck        # tsc --noEmit per package
pnpm test             # vitest in packages that have tests
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # seed plans + admin
pnpm infra:up         # docker compose up postgres+pgbouncer+redis
pnpm infra:down       # docker compose down
```

---

## Folder layout

```
sepaito-web/
├── apps/
│   ├── web/                    Next.js app (marketing + UI)
│   └── api/                    NestJS app (REST + gRPC)
├── packages/
│   ├── db/                     Prisma schema + seed
│   └── shared/                 Zod schemas + Robokassa utils
├── infra/
│   └── docker-compose.yml      Postgres 18, PgBouncer, Redis
├── biome.json
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Production checklist (later)

- Replace `RobokassaStubProvider` with a real provider (the interface is in `apps/api/src/payments/providers/payment-provider.interface.ts`).
- Replace the `EmailWorker` console logging with a Resend transport (env var `RESEND_API_KEY` is already plumbed).
- Set `ROBOKASSA_TEST_MODE=0` and use real merchant credentials.
- Provision strong `AUTH_SECRET` and `JWT_SECRET` (≥ 32 random bytes, base64).
- Run the API behind a TLS-terminating proxy and set `cookie.secure=true` (already done via `NODE_ENV=production`).

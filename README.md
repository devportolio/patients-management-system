# Patients Management System

A production-grade, full-stack patient directory built as a **monorepo**: a **Next.js** (App Router) frontend and a **NestJS + Prisma + PostgreSQL** backend, with role-aware JWT authentication, a polished accessible UI, and resilience to simulated latency/failures.

- **Frontend** — Next.js 15, TypeScript, Tailwind CSS, shadcn-style primitives (Radix), TanStack Query, React Hook Form + Zod
- **Backend** — NestJS 11, Prisma 6, PostgreSQL, Passport JWT, bcrypt
- **Tooling** — pnpm workspaces + Turborepo, strict TypeScript, ESLint + Prettier, Jest, Vitest, Docker Compose

---

## Table of contents

- [Architecture](#architecture)
- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Demo accounts](#demo-accounts)
- [Environment variables](#environment-variables)
- [API contract](#api-contract)
- [Testing](#testing)
- [Key design decisions](#key-design-decisions)

---

## Architecture

```
                    ┌──────────────────────────────────────────┐
   Browser ───────► │  Next.js (web)                            │
                    │  • App Router pages, middleware (route     │
                    │    protection)                             │
                    │  • TanStack Query + optimistic updates     │
                    │  • /api/* ──► proxied to the API (BFF)     │
                    └───────────────┬──────────────────────────┘
                                    │  same-origin /api proxy
                                    ▼
                    ┌──────────────────────────────────────────┐
                    │  NestJS (api)                             │
                    │  • Auth (JWT + httpOnly cookie, bcrypt)    │
                    │  • Guards: JwtAuthGuard + RolesGuard       │
                    │  • Patients module (REST, pagination)      │
                    │  • Chaos interceptor (latency/failures)    │
                    └───────────────┬──────────────────────────┘
                                    ▼
                              PostgreSQL (Prisma)
```

**Why the BFF proxy?** The browser talks to the same-origin `/api` path, which Next rewrites to the API. This lets the backend's **httpOnly** auth cookie live on the web origin, so Next middleware can gate routes by it — while the cookie stays inaccessible to JavaScript (XSS-resistant). The JWT signature and expiry are still authoritatively validated by the API.

The validation contract (`@pms/shared`) is **Zod schemas shared by both apps** — the frontend form validation and the backend DTO validation are derived from the exact same source, so they can never drift.

---

## Quick start (Docker)

The fastest way to run the whole stack (PostgreSQL + API + web):

```bash
# 1. Clone
git clone <your-repo-url> patients-management-system
cd patients-management-system

# 2. (Optional) provide your own secrets — sensible defaults are built in
cp .env.example .env

# 3. Build and run everything
docker compose up --build
```

Then open **http://localhost:3000** and sign in with a [demo account](#demo-accounts).

On boot the API automatically applies migrations and seeds the database (two users + 50 sample patients). The seed is idempotent, so restarts are safe.

| Service       | URL                          |
| ------------- | ---------------------------- |
| Web           | http://localhost:3000        |
| API           | http://localhost:4000        |
| API docs      | http://localhost:4000/docs   |
| Health        | http://localhost:4000/health |
| Postgres      | localhost:5432               |

Stop with `docker compose down` (add `-v` to also drop the database volume).

### Hot reload (Docker dev mode)

To run the containerized stack with **live reload** — your edits are bind-mounted in and the apps run in watch mode (NestJS `--watch` + Next.js HMR):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Edit anything under `apps/api/src` or `apps/web/src` and it recompiles in place — no rebuild. The container's `node_modules` and build output are shielded by anonymous volumes so your host (macOS) binaries never clash with the container's (Linux). File watching uses polling (`CHOKIDAR_USEPOLLING` / `WATCHPACK_POLLING`) for reliability across host OSes.

> Note: editing `packages/shared` hot-reloads the **web** app (Next compiles it from source via `transpilePackages`); the **API** consumes it from its compiled `dist`, so a shared-package change needs `pnpm --filter @pms/shared build` (or an API container restart).

> **After changing dependencies** (anything in a `package.json`), recreate the stack with volumes wiped so the shielded `node_modules` re-seed from the rebuilt image — otherwise the container keeps the old dependency set:
>
> ```bash
> docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up --build
> ```

---

## Deploy to Dokploy

`docker-compose.dokploy.yml` deploys the stack to [Dokploy](https://dokploy.com). The web app is public (behind Dokploy's Traefik + Let's Encrypt) and proxies `/api/*` to the API over the internal network, so the auth cookie stays same-origin. The API is **also** published on its own subdomain (`API_DOMAIN`) so the **Swagger docs are reachable at `https://<API_DOMAIN>/docs`**. Postgres stays internal.

1. In Dokploy, create a **Compose** service pointing at this repository, and set the compose file path to `docker-compose.dokploy.yml`.
2. In the **Environment** tab, set:

   | Variable            | Required | Example / default                       |
   | ------------------- | -------- | --------------------------------------- |
   | `WEB_DOMAIN`        | ✅       | `patients.example.com`                  |
   | `JWT_SECRET`        | ✅       | a long random string                    |
   | `POSTGRES_PASSWORD` | ✅       | a strong password                       |
   | `API_DOMAIN`        |          | public API host (default: `api.<WEB_DOMAIN>`) — serves `/docs` |
   | `JWT_EXPIRES_IN`    |          | `15m`                                   |
   | `CHAOS_ENABLED`     |          | `false` (set `true` to demo resilience) |
   | `TLS_CERTRESOLVER`  |          | `letsencrypt`                           |

3. Point **both** `WEB_DOMAIN` and `API_DOMAIN` DNS at your Dokploy host and **Deploy**. On boot the API runs migrations and seeds the [demo accounts](#demo-accounts).

The Traefik routing labels (HTTPS + HTTP→HTTPS redirect) for both `web` and `api` are baked into the compose file, and both join Dokploy's shared `dokploy-network`. No host ports are published — routing is entirely via Traefik.

> Exposing the API subdomain makes the **whole** API publicly reachable (not just `/docs`). Every endpoint stays protected by the auth guards, but if you'd rather keep the API private, remove the `api` service's `traefik.*` labels and view Swagger locally at `http://localhost:4000/docs`.

---

## Local development

Requires **Node ≥ 20** (Node 22 recommended), **pnpm** (via Corepack), and a PostgreSQL instance.

```bash
# Enable pnpm
corepack enable

# Install all workspace dependencies
pnpm install

# Start a local Postgres (or use your own and update DATABASE_URL)
docker run -d --name pms-db -e POSTGRES_USER=pms -e POSTGRES_PASSWORD=pms_password \
  -e POSTGRES_DB=pms -p 5432:5432 postgres:16-alpine

# Configure env
cp .env.example .env   # the defaults already point at the Postgres above

# Apply migrations and seed
pnpm db:migrate
pnpm db:seed

# Run both apps (Turborepo runs them in parallel)
pnpm dev
```

- Web → http://localhost:3000
- API → http://localhost:4000

Useful root scripts (all powered by Turborepo, so they respect the dependency graph and cache):

```bash
pnpm dev          # run api + web in watch mode
pnpm build        # build every package
pnpm lint         # eslint across the monorepo
pnpm typecheck    # strict tsc --noEmit everywhere
pnpm test         # unit tests (api + web + shared)
pnpm test:e2e     # api end-to-end tests (needs a database)
pnpm format       # prettier --write
```

---

## Demo accounts

Both seeded accounts use the password **`Password123!`**.

| Role            | Email            | Capabilities                                   |
| --------------- | ---------------- | ---------------------------------------------- |
| **Admin**       | `admin@demo.com` | Full CRUD — create, edit, delete patients      |
| **User** (view) | `user@demo.com`  | Read-only — list, search, sort, view details   |

The login screen has one-click buttons to fill either account.

---

## Environment variables

See [`.env.example`](./.env.example). Highlights:

| Variable             | Default                 | Purpose                                              |
| -------------------- | ----------------------- | ---------------------------------------------------- |
| `DATABASE_URL`       | local Postgres          | Prisma connection string                             |
| `JWT_SECRET`         | _(dev placeholder)_     | Signing secret — **set a strong value in prod**      |
| `JWT_EXPIRES_IN`     | `15m`                   | Token lifetime (also drives the cookie max-age)      |
| `WEB_ORIGIN`         | `http://localhost:3000` | CORS origin allowed by the API                       |
| `CHAOS_ENABLED`      | `true`                  | Toggle the latency/failure simulation                |
| `CHAOS_FAILURE_RATE` | `0.12`                  | Probability of a simulated transient `503` on `/patients` |
| `API_INTERNAL_URL`   | `http://localhost:4000` | Proxy target the web app rewrites `/api/*` to        |

---

## API contract

All `/patients` routes require authentication (`401` if unauthenticated). Writes require the `admin` role (`403` otherwise).

| Method   | Endpoint         | Role          | Description                                                       |
| -------- | ---------------- | ------------- | ----------------------------------------------------------------- |
| `POST`   | `/auth/login`    | Any           | `{ email, password }` → `{ token, user }`; sets httpOnly cookie   |
| `POST`   | `/auth/logout`   | Any           | Clears the auth cookie → `{ ok: true }`                           |
| `GET`    | `/auth/me`       | Authenticated | Returns the current `{ id, email, role }`                         |
| `GET`    | `/patients`      | Admin / User  | `{ data, page, limit, total }` — supports `page`, `limit`, `search`, `sortBy`, `sortOrder` |
| `GET`    | `/patients/:id`  | Admin / User  | A single `Patient` (`404` if missing)                             |
| `POST`   | `/patients`      | Admin         | Create a patient → `Patient` (`201`)                              |
| `PUT`    | `/patients/:id`  | Admin         | Replace a patient → `Patient`                                     |
| `DELETE` | `/patients/:id`  | Admin         | `{ ok: true }`                                                    |
| `GET`    | `/health`        | Any           | Liveness + DB connectivity                                        |

Errors use a consistent envelope: `{ statusCode, error, message, path, timestamp }`.

**Interactive docs (Swagger / OpenAPI):** browse and try every endpoint at **http://localhost:4000/docs** (raw spec at `/docs-json`). It documents request/response schemas, the cookie + bearer auth schemes, and which routes are admin-only. Use **Authorize → bearer** with the token from `POST /auth/login` to call protected routes from the UI.

**Resilience:** when `CHAOS_ENABLED=true`, the API injects random latency and occasional `503`s on data endpoints (never on auth/health). The frontend handles these gracefully with skeletons, retry, and optimistic-update rollback — toggle it off to compare.

---

## Testing

**Backend** — Jest. Unit tests for services/guards (mocked, no DB) and end-to-end tests (Supertest against a real Postgres) covering the auth flow, CRUD, validation, and the `401`/`403` RBAC matrix.

```bash
pnpm --filter @pms/api test        # unit
pnpm --filter @pms/api test:e2e    # e2e (requires DATABASE_URL)
```

**Frontend** — Vitest + Testing Library for components/hooks, plus shared Zod schema tests.

```bash
pnpm --filter @pms/web test
pnpm --filter @pms/shared test
```

---

## Key design decisions

- **Zod as the single source of truth** (`packages/shared`). Both the React Hook Form resolver and the NestJS validation pipe consume the same schemas, so client and server validation cannot diverge.
- **Real JWT for the "mock token" requirement.** The brief's backend section asks for JWT + bcrypt + expiry, so the token is a genuine signed JWT (strictly stronger than a mock) delivered via an **httpOnly cookie** for XSS safety.
- **BFF proxy** so route-protecting middleware can read the auth cookie on the web origin without exposing the token to JavaScript.
- **Global guards** (`JwtAuthGuard` then `RolesGuard`) with `@Public()` / `@Roles()` decorators — authorization is declarative and centrally enforced.
- **Optimistic updates with rollback** on edit/delete via TanStack Query (`onMutate` snapshot → `onError` restore), giving an instant UI that self-heals when the chaos layer fails a request.
- **Design tokens + semantic palette** (clinical teal) as CSS variables driving a full light/dark theme, with accessible focus states, reduced-motion support, and a table that collapses to stacked cards on mobile.

---

## Notes

- **Password hashing** uses `bcryptjs` (pure-JS, bcrypt-compatible) to avoid native build friction in Alpine containers.

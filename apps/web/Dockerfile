# syntax=docker/dockerfile:1
# Build context is the monorepo root (see docker-compose.yml).

# ---- Builder: install all deps and build shared + web ----
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
# Next bakes rewrite() destinations at build time, so the proxy target must be
# known here. Defaults to localhost for local builds; compose overrides it.
ARG API_INTERNAL_URL=http://localhost:4000
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
RUN pnpm --filter @pms/shared build && pnpm --filter @pms/web build

# ---- Dev: install deps, then run `next dev` (HMR) ----
# Source is bind-mounted at runtime; node_modules/.next are shielded by
# anonymous volumes. next dev reads next.config at runtime, so the API proxy
# target comes from the container env — no build arg needed here.
FROM node:22-alpine AS dev
RUN apk add --no-cache libc6-compat && corepack enable
ENV NODE_ENV=development
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @pms/shared build
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "dev"]

# ---- Runner ----
FROM node:22-alpine AS runner
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=builder /repo /repo

WORKDIR /repo/apps/web
EXPOSE 3000
# `next start` evaluates next.config at runtime, so API_INTERNAL_URL (the proxy
# target) is read from the container environment at boot.
CMD ["pnpm", "start"]

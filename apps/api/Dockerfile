# syntax=docker/dockerfile:1
# Build context is the monorepo root (see docker-compose.yml).

# ---- Builder: install all deps and compile shared + api ----
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl libc6-compat && corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pms/shared build \
  && pnpm --filter @pms/api exec prisma generate \
  && pnpm --filter @pms/api build

# ---- Dev: install deps + generate client, then run in watch mode ----
# Source is bind-mounted at runtime (see docker-compose.dev.yml); node_modules
# are shielded by anonymous volumes so the container keeps its Linux binaries.
FROM node:22-alpine AS dev
RUN apk add --no-cache openssl libc6-compat && corepack enable
ENV NODE_ENV=development
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @pms/shared build \
  && pnpm --filter @pms/api exec prisma generate
WORKDIR /repo/apps/api
EXPOSE 4000
# migrate + seed (idempotent) then `nest start --watch`.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && (pnpm exec prisma db seed || true) && pnpm dev"]

# ---- Runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat && corepack enable
ENV NODE_ENV=production
WORKDIR /repo

# Copy the fully-installed & built workspace (pnpm symlinks preserved).
COPY --from=builder /repo /repo

WORKDIR /repo/apps/api
EXPOSE 4000
CMD ["sh", "docker-entrypoint.sh"]

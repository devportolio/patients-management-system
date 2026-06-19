#!/bin/sh
set -e

echo "⏳ Applying database migrations..."
pnpm exec prisma migrate deploy

echo "🌱 Seeding database (idempotent)..."
pnpm exec prisma db seed || echo "⚠️  Seed step skipped/failed; continuing."

echo "🚀 Starting API..."
exec node dist/main.js

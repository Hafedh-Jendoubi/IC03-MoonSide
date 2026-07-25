# ─────────────────────────────────────────────
# 1. Dependencies stage
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies separately for better caching
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────
# 2. Builder stage
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Declare build argument for API URL
ARG NEXT_PUBLIC_API_URL
# Set environment variable from build argument
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Disable telemetry (optional)
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─────────────────────────────────────────────
# 3. Production runner (optimized)
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# HOSTNAME is force-set inline as well, since some platforms (e.g. Render)
# inject their own HOSTNAME env var at container start, which would
# otherwise override the Dockerfile ENV above and break binding.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
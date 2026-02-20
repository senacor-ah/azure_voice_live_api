# ============================================================================
# Senacor VoiceLive - Multi-stage Docker Build
# ============================================================================
# Optimized for Azure App Service with WebSocket support
# Uses Next.js standalone output + custom server (server.ts) for WS

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc6-compat for Alpine compatibility with some npm packages
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2: Build the application
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (standalone output configured in next.config.ts)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production runner
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Azure App Service expects port 8080 by default
ENV PORT=8080
ENV HOST=0.0.0.0

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output (includes server + bundled node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy custom server for WebSocket support
# The standalone output includes its own server.js, but we need our custom
# server.ts for the /ws/voice WebSocket endpoint
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy lib/ source files needed at runtime by the custom server
# (voice-proxy-handler imports lib/services/*, lib/rag/*, lib/types/*)
COPY --from=builder /app/lib ./lib

# Copy package files and install only production dependencies
# (avoids copying full node_modules incl. devDependencies from build stage)
COPY --from=builder /app/package.json /app/package-lock.json* ./
RUN npm ci --omit=dev && npm install -g tsx

# Create recordings directory
RUN mkdir -p recordings && chown nextjs:nodejs recordings

USER nextjs

EXPOSE 8080

# Health check for Azure App Service
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start custom server with tsconfig-paths for @/ alias resolution + tsx for TypeScript
CMD ["tsx", "server.ts"]

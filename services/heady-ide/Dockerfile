# ╔══════════════════════════════════════════════════════════════════╗
# ║  HEADY™ AI-IDE Server — Production Dockerfile                   ║
# ║  Cloud Run: ide.heady-ai.com                                    ║
# ║  Multi-stage: builds web client + serves via Express backend    ║
# ║  © 2026 HeadySystems Inc. — Eric Haywood, Founder               ║
# ╚══════════════════════════════════════════════════════════════════╝

# ── Stage 1: Build the web client ────────────────────────────────
FROM node:22-slim AS client-build
WORKDIR /client

# Copy frontend source
COPY ../../HeadyAI-IDE/package.json ../../HeadyAI-IDE/package-lock.json* ./
RUN npm ci --ignore-scripts --omit=optional

COPY ../../HeadyAI-IDE/ ./
ENV VITE_MODE=web
RUN npm run build:web

# ── Stage 2: Production server ───────────────────────────────────
FROM node:22-slim AS base
WORKDIR /app

# System deps for node-pty (terminal) and Git
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git openssh-client curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Package install (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# App code
COPY . .

# Copy built web client from stage 1
COPY --from=client-build /client/build-web ./public

# Health check
HEALTHCHECK --interval=29s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Cloud Run expects PORT env
ENV PORT=8080
ENV SERVE_STATIC=true
EXPOSE 8080

# Non-root user
RUN addgroup --system heady && adduser --system --ingroup heady heady
USER heady

CMD ["node", "--experimental-vm-modules", "heady-ide-server.js"]

# ╔══════════════════════════════════════════════════════════════════╗
# ║  HEADY™ AI-IDE Server — Production Dockerfile                   ║
# ║  Cloud Run: ide.heady-ai.com                                    ║
# ║  Multi-stage: builds web client + serves via Express backend    ║
# ║  BUILD FROM REPO ROOT: docker build -f services/heady-ide/Dockerfile .
# ║  © 2026 HeadySystems Inc. — Eric Haywood, Founder               ║
# ╚══════════════════════════════════════════════════════════════════╝

# ── Stage 1: Build the web client ────────────────────────────────
FROM node:22-slim AS client-build
WORKDIR /client

# Copy frontend source (paths relative to repo root build context)
COPY HeadyAI-IDE/package.json HeadyAI-IDE/package-lock.json* ./
RUN npm ci --ignore-scripts --omit=optional

COPY HeadyAI-IDE/ ./

# Inject web-mode env vars at build time
ARG VITE_API_URL=https://headyme-site-667608982461.us-central1.run.app
ARG VITE_WS_URL=wss://headyme-site-667608982461.us-central1.run.app
ENV VITE_MODE=web
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

RUN npm run build:web

# ── Stage 2: Production server ───────────────────────────────────
FROM node:22-slim AS base
WORKDIR /app

# System deps for node-pty (terminal) and Git
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git openssh-client curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Package install (cached layer)
COPY services/heady-ide/package.json services/heady-ide/package-lock.json* ./
RUN npm ci --omit=dev

# App code
COPY services/heady-ide/ .

# Copy built web client from stage 1
COPY --from=client-build /client/build-web ./public

# Health check
HEALTHCHECK --interval=29s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Cloud Run expects PORT env
ENV PORT=8080
ENV SERVE_STATIC=true
ENV NODE_ENV=production
EXPOSE 8080

# Non-root user
RUN addgroup --system heady && adduser --system --ingroup heady heady
USER heady

CMD ["node", "--experimental-vm-modules", "heady-ide-server.js"]

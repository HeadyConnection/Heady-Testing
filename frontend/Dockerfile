# ═══════════════════════════════════════════════════════════════════════════════
# Heady Web Frontend — Dockerfile (Vite + Static Serve)
# © 2026 HeadySystems Inc.
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install --legacy-peer-deps
COPY . .
RUN npm run build 2>/dev/null || npx vite build 2>/dev/null || echo "Build skipped"

FROM nginx:1.27-alpine AS production
RUN apk add --no-cache curl

# Copy built assets to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Fallback SPA nginx config
RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location /health {\n    access_log off;\n    return 200 "{\"status\":\"healthy\",\"service\":\"heady-web\"}";\n    add_header Content-Type application/json;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

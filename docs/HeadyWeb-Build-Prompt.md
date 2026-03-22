# HeadyWeb — Optimal Build Prompt

> **Copy this prompt into your AI coding agent (Codex, Claude Code, Cursor, etc.) to build HeadyWeb from scratch using the existing monorepo architecture.**

---

## System Prompt

You are building **HeadyWeb** — the AI-native browser shell for the Heady™ platform. HeadyWeb is a **Webpack 5 Module Federation** host that dynamically loads 7 micro-frontend remotes at runtime, each mapping to a different Heady domain surface.

### What Already Exists (DO NOT recreate from scratch)

The monorepo at `Heady-Testing/` already contains:
- `services/heady-web/` — The shell scaffold (README, webpack.config.js, docker-compose.yml, scripts)
- `services/heady-web/src/shell/` — Host entry, index.html, REMOTE_REGISTRY, dynamic remote loader
- `services/heady-web/remotes/` — 7 stub directories (antigravity, landing, heady-ide, swarm-dashboard, governance-panel, projection-monitor, vector-explorer)
- `apps/headyweb/` — Alternative location with package.json
- `heady-microfrontend-portal/SKILL.md` — Build patterns and instructions
- `docs/HeadyWeb-Fusion-Plan.md` — Full architectural vision
- `docs/benefit-pack/PRODUCT_SURFACES.md` — Product surface definitions
- `configs/INSTALLABLE_PACKAGES/HeadyWeb/` — Installable package config

### Architecture

```
HeadyWeb Universal Shell (Host) — Port 3000
├── src/shell/
│   ├── index.html           # Shell HTML container
│   ├── index.js             # Boot sequence + REMOTE_REGISTRY
│   └── load-dynamic-remote.js  # Runtime Module Federation loader
├── src/services/
│   ├── ui-registry.js       # Domain → UI ID mapping
│   └── domain-router.js     # Hostname resolution
├── src/vector-federation.js # Federated vector memory
├── remotes/
│   ├── antigravity/         # 3D vector space (Three.js, emerald/green)
│   ├── landing/             # Marketing landing (dark blue/cyan)
│   ├── heady-ide/           # Code editor + AI buddy (VS Code-style dark/blue)
│   ├── swarm-dashboard/     # Agent swarm monitor (amber/gold)
│   ├── governance-panel/    # Policy & audit (purple)
│   ├── projection-monitor/  # Deployment health (cyan)
│   └── vector-explorer/     # Vector memory explorer (teal/green, Three.js)
├── webpack.config.js        # Unified Webpack 5 Module Federation config
└── docker-compose.yml       # Container orchestration
```

### Remote Registry

| Remote | Scope | Module | Theme |
|--------|-------|--------|-------|
| antigravity | antigravity | ./App | Emerald + Three.js |
| landing | headyLanding | ./App | Dark blue/cyan |
| heady-ide | headyIDE | ./App | Dark/blue VS Code |
| swarm-dashboard | swarmDashboard | ./App | Amber/gold |
| governance-panel | governancePanel | ./App | Purple |
| projection-monitor | projectionMonitor | ./App | Cyan |
| vector-explorer | vectorExplorer | ./App | Teal + Three.js |

Each remote exposes `./App` (root DOM component) and `./mount` (lifecycle function):
```js
// Mount API pattern for every remote
import { mount } from 'remoteScope/mount';
const { unmount } = mount(containerElement, { theme: 'dark', domain: 'headyme.com', userId: 'abc123' });
```

---

## Build Instructions

### Phase 1: Wire the Shell Host (Priority: CRITICAL)

1. **Read** `services/heady-web/webpack.config.js` and `src/shell/index.js`
2. **Ensure** the shell boots with Module Federation `ModuleFederationPlugin` and registers all 7 remotes
3. **Implement** `load-dynamic-remote.js` to dynamically inject `<script>` tags for each remote's `remoteEntry.js`
4. **Wire** the shell's routing: domain hostname → ui-registry → load correct remote
5. **Add** integrated workspace fallback when no remote matches (auth form + vector workspace + mini IDE + Buddy chat)
6. **Test**: `npm run dev` should serve the shell at localhost:3000 and attempt remote loads

### Phase 2: Build Each Micro-Frontend Remote

For each of the 7 remotes:
1. **Create** `remotes/{name}/src/App.js` — the root component
2. **Create** `remotes/{name}/src/mount.js` — the mount/unmount lifecycle
3. **Create** `remotes/{name}/webpack.config.js` — Module Federation config exposing `./App` and `./mount`
4. **Theme** each remote with its designated color palette (see registry table above)
5. **Build**: `npm run build:remotes` should produce `remoteEntry.js` files for all 7

**Remote implementation priorities:**
1. `landing` — first (simplest, validates MF pipeline)
2. `heady-ide` — second (highest value, embeds Monaco editor or CodeMirror)
3. `swarm-dashboard` — third (real-time agent monitoring)
4. `antigravity` — fourth (Three.js 3D vector visualization)
5. `governance-panel` — fifth
6. `vector-explorer` — sixth (Three.js vector memory)
7. `projection-monitor` — seventh

### Phase 3: Sacred Geometry Design System

Apply φ (Golden Ratio) constants throughout — ZERO magic numbers:
```js
const PHI = 1.618033988749895;
const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

// Layout
const TOOLBAR_HEIGHT = 55;         // φ × 34
const SIDECAR_WIDTH = 377;         // fib(14)
const SIDEBAR_WIDTH = 233;         // fib(13)

// Timing
const HEARTBEAT_MS = 29034;        // φ⁷ × 1000
const ANIMATION_DURATION = 377;    // fib(14) ms
const DEBOUNCE_MS = 233;           // fib(13) ms

// Limits
const MAX_NODES = 233;             // fib(13) — token efficiency cap
```

**UI Principles:**
- Dark mode by default with glassmorphism (frosted glass effects)
- Golden ratio proportions for all layout splits
- Organic breathing animations (scale 1.0 → 1.02 on φ-timed intervals)
- Color palette: deep navy (#0a0e27) → electric blue (#667eea) → emerald (#48bb78) per-domain

### Phase 4: Backend Integration

HeadyWeb connects to the running `heady-manager.js` server:
```
HEADY_API_URL=https://heady-manager-609590223909.us-central1.run.app
```

**Endpoints to wire:**
- `/health` — system health status (display in shell header)
- `/api/auth/login` — user authentication
- `/api/vector/search` — semantic search for vector-explorer remote
- `/api/agents/status` — agent swarm data for swarm-dashboard remote
- `/api/mcp/tools` — MCP tool listing for heady-ide remote
- `/api/governance/policies` — policy data for governance-panel remote

### Phase 5: Docker + Cloud Run Deployment

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build:all

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Deploy to Cloud Run:
```bash
gcloud run deploy heady-web \
  --source . \
  --region us-central1 \
  --project heady-prod-609590223909 \
  --allow-unauthenticated
```

---

## Key Constraints

1. **Node.js ≥ 20** — use ESM imports where possible
2. **Webpack 5** — Module Federation is the micro-frontend strategy (not Vite)
3. **No React dependency in the shell** — remotes can use React/Vue/Vanilla independently
4. **All state** persists to `localStorage` under `headyweb.workspace.v1`
5. **Turbo pipeline** — respect `turbo.json` for build ordering
6. **Pre-commit hooks** — all commits run secret scan + syntax check
7. **8-layer sanitization** for any user input: Zod → max-length → DOMPurify → parameterized queries → CSP → URL allowlist → path jail → secret scanning
8. **Per-tab session isolation** — `session.fromPartition()` for each tab context

## Environment Variables

```env
NODE_ENV=production
PORT=3000
HEADY_VERSION=3.1.0
HEADY_REGISTRY_URL=/api/domains/current
HEADY_API_URL=https://heady-manager-609590223909.us-central1.run.app
JWT_SECRET=<from .env>
```

## Verification

After building, verify:
1. `npm run build:all` completes without errors
2. Shell loads at localhost:3000 with navigation rail
3. Each remote mounts/unmounts cleanly
4. Domain routing resolves correctly (headyme.com → landing, headyio.com → heady-ide, etc.)
5. Fallback workspace appears for unmatched domains
6. Docker build succeeds and serves on port 80
7. `node --check` passes on all JS files

---

*This prompt synthesizes: HeadyWeb-Fusion-Plan.md, services/heady-web/README.md, PRODUCT_SURFACES.md, heady-microfrontend-portal/SKILL.md, and the complete monorepo architecture.*

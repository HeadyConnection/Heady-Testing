# HeadyBuddy — Optimal Build Prompt

> **Copy this prompt into your AI coding agent (Codex, Claude Code, Cursor, etc.) to build HeadyBuddy — the AI companion and delegated digital operator.**

---

## System Prompt

You are building **HeadyBuddy** — the AI-powered companion and delegated digital operator for the Heady™ platform. HeadyBuddy is a multi-surface product: an Express **microservice** (chat, tasks, state, orchestration), an **embeddable widget** (drop into any HTML page), a **PWA** (installable on Android/Windows/Linux), and an **agent** in the Heady swarm (Omni-Orchestrator with 15 output formats).

### What Already Exists (DO NOT recreate from scratch)

The monorepo at `Heady-Testing/` contains:
- `services/heady-buddy/index.js` — **407-line Express service** (port 3351, fully functional)
- `services/heady-buddy/heady-buddy.manifest.yaml` — K8s + Istio manifest (244 lines)
- `services/heady-buddy/pwa/` — PWA assets
- `services/heady-buddy/widget/` — Embeddable chat widget
- `src/agents/heady-buddy.js` — ESM agent (AgentBase, context memory, infer routing)
- `src/agents/heady-buddy-agent.js` — **219-line Omni-Orchestrator** (15 output formats, 9 swarm nodes)
- `configs/heady-buddy.yaml` — Service config
- `configs/heady-buddy-always-on.yaml` — Always-on config
- `docs/BUDDY-BUILDER-GUIDE.md` — Full builder guide (410 lines)
- `docs/benefit-pack/PRODUCT_SURFACES.md` — Product surface definition
- `docs/benefit-pack/HEALTHY_EXPANSION_PLAN.md` — Expansion roadmap
- `workers/heady-buddy-worker/` — Cloudflare Worker
- `public/icons/heady-buddy.svg` — Icon asset

---

## Architecture

```
HeadyBuddy Ecosystem
│
├── Express Microservice (services/heady-buddy/index.js)
│   ├── Port 3351 (companion domain)
│   ├── /api/buddy/chat         — AI chat with session memory
│   ├── /api/buddy/state        — State persistence (GET/POST)
│   ├── /api/buddy/task         — Task queue (create, list)
│   ├── /api/buddy/orchestrator — Swarm orchestrator status
│   ├── /context/enrich         — HeadyAutoContext enrichment
│   ├── /execute                — CSL domain-matched task execution
│   ├── /health, /healthz       — Health endpoints
│   └── /info                   — Service info + φ constants
│
├── Agent Layer (src/agents/)
│   ├── heady-buddy.js          — Lightweight ESM agent
│   └── heady-buddy-agent.js    — Supreme Omni-Orchestrator
│       ├── 15 Output Formats (raw → animated → dashboard → report)
│       ├── 9 Swarm Nodes (Scientist, Vinci, Maid, Jules, Brain, etc.)
│       ├── Intent Analysis + Format Detection
│       └── 3 Service Modes (A: Agentic, B: Data Mesh, C: Full-Stack)
│
├── Embeddable Widget (widget/)
│   └── widget.js — Drop-in chat for any HTML page
│
├── PWA (pwa/)
│   └── Installable on Android, Windows, Linux
│
└── Cloudflare Worker (workers/heady-buddy-worker/)
    └── Edge-deployed buddy proxy
```

---

## Build Instructions

### Phase 1: Service Backend (Priority: CRITICAL)

The Express service at `services/heady-buddy/index.js` is **already functional** (407 lines). Enhance it:

#### Existing Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/buddy/chat` | POST | Chat with AI — sends to `MANAGER_API/api/ai/chat` |
| `/api/buddy/state` | GET/POST | Session state persistence |
| `/api/buddy/task` | POST | Queue async tasks |
| `/api/buddy/tasks` | GET | List recent tasks (last 50) |
| `/api/buddy/orchestrator` | GET | Swarm status, session count, pending tasks |
| `/api/headybuddy-config` | GET | Client config (features, endpoints) |
| `/context/enrich` | POST | HeadyAutoContext enrichment |
| `/execute` | POST | CSL-matched task execution |
| `/health` `/healthz` `/health/live` `/health/ready` | GET | Health probes |

#### What to Add

1. **Redis-backed sessions** — Replace `const sessions = new Map()` with Redis
   ```js
   const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
   ```

2. **Vector memory** — Connect to Neon Postgres for persistent context
   ```js
   const DATABASE_URL = process.env.DATABASE_URL;
   // Store conversation embeddings for cross-session recall
   ```

3. **Permission tiers** — Implement Observer / Actor / Autonomous modes
   ```js
   const PERMISSION_TIERS = {
     observer: { canRead: true, canWrite: false, canExecute: false },
     actor: { canRead: true, canWrite: true, canExecute: false },  // preview + approve
     autonomous: { canRead: true, canWrite: true, canExecute: true },
   };
   ```

4. **Action preview + approval flow** — For write operations in Actor tier

5. **Cross-device sync** — WebSocket endpoint for real-time sync
   ```js
   app.ws('/api/buddy/sync', (ws, req) => { /* device handoff */ });
   ```

### Phase 2: Omni-Orchestrator Agent

The agent at `src/agents/heady-buddy-agent.js` is the brain. It features:

#### 15 Output Formats

| Format | Icon | Description |
|--------|------|-------------|
| `raw` | 📊 | Unprocessed JSON — machine-readable |
| `text` | 📝 | Clean plain text — copy-paste ready |
| `markdown` | 📋 | Structured markdown (default) |
| `pretty` | ✨ | Color-coded, indented, visual hierarchy |
| `branded` | 🎨 | Full Heady branding — company colors, logos |
| `infographic` | 📈 | Visual data with charts and icons |
| `animated` | 🎬 | Motion graphics with micro-animations |
| `dashboard` | 📱 | Interactive dashboard with KPIs and widgets |
| `presentation` | 🖥️ | Slide deck with speaker notes |
| `report` | 📑 | Executive-quality formal document |
| `conversational` | 💬 | Warm chat-style tone |
| `technical` | ⚙️ | Engineering-grade with code samples |
| `audience` | 👥 | Adapted for specific audiences (board, donors) |
| `csv` | 📊 | Tabular data export |
| `api` | 🔌 | Structured API-compatible JSON |

#### 9 Swarm Nodes

| Node | Role | Routes To |
|------|------|-----------|
| 🧪 HeadyScientist | Quant & Logic | Data structures, ML, API routing |
| 🎨 HeadyVinci | UI/UX Visionary | Theme tokens, animations, aesthetics |
| 🧹 HeadyMaid | Code Purifier | Memory leaks, dead code, security |
| ⚙️ HeadyMaintenance | SRE Guardian | Docker, CI/CD, zero-downtime |
| 💻 HeadyJules | Master Coder | Full-stack gen, refactoring, debug |
| 🧠 HeadyBrain | Central Intelligence | AI routing, provider management |
| 💰 HeadyFinTech | Financial Intel | Quant modeling, risk, audit trails |
| 🛡️ QA | Quality Assurance | Jest, Cypress, XSS prevention |
| 📚 Q&A | Knowledge Bridge | Docs, guides, audit trail docs |

### Phase 3: Embeddable Widget

Drop-in chat widget for any HTML page:

```html
<!-- HeadyBuddy Chat Widget -->
<script>
  window.__HEADY_CONFIG__ = {
    apiKey: 'hdy_YOUR_API_KEY',
    position: 'bottom-right',
    theme: 'dark',
    greeting: "Hey! I'm HeadyBuddy. How can I help?"
  };
</script>
<script src="https://headybuddy.org/widget.js" async></script>
```

Build `widget/widget.js`:
- Self-contained IIFE that injects a chat bubble + panel
- Sacred Geometry styling (dark navy, glassmorphism)
- WebSocket connection for real-time responses
- `position`: bottom-right, bottom-left, or centered
- Persists sessionId in localStorage
- `φ`-timed breathing animation on the bubble

### Phase 4: PWA (Progressive Web App)

Make HeadyBuddy installable on Android, Windows, Linux:

```json
// pwa/manifest.json
{
  "name": "HeadyBuddy",
  "short_name": "Buddy",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/icons/heady-buddy-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/heady-buddy-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- Service worker for offline shell + cached responses
- Push notifications for task completion
- Share target API for cross-app sharing
- Background sync for queued tasks

### Phase 5: Personal Vault & Skill Packs

1. **Personal Vault** — Encrypted store for tokens, preferences, trust policies
   ```js
   // Encrypted at rest with user's master key
   app.post('/api/buddy/vault/store', authMiddleware, (req, res) => { });
   app.get('/api/buddy/vault/retrieve', authMiddleware, (req, res) => { });
   ```

2. **Skill Packs** — Domain-specific automation extensions
   ```js
   const SKILL_PACKS = {
     'site-interaction': { tools: ['click', 'type', 'scroll', 'screenshot'] },
     'calendar': { tools: ['schedule', 'reschedule', 'cancel', 'check'] },
     'email': { tools: ['compose', 'reply', 'search', 'summarize'] },
     'code': { tools: ['explain', 'refactor', 'test', 'deploy'] },
   };
   ```

3. **Sandboxed Automation** — Separate sessions for automation vs personal browsing

---

## φ-Math Constants (MANDATORY — Zero Magic Numbers)

```js
const PHI = 1.618033988749895;
const PSI = 1 / PHI;                  // ≈ 0.618
const PSI2 = PSI * PSI;               // ≈ 0.382
const FIB = [1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987];
const VECTOR_DIM = 384;
const CSL_GATES = Object.freeze({
  include: PSI * PSI,    // ≈ 0.382
  boost: PSI,            // ≈ 0.618
  inject: PSI + 0.1,     // ≈ 0.718
});

// Kubernetes resources
// replicas: 3 (F4), maxReplicas: 13 (F7)
// memory: 89Mi (F11) → 377Mi (F14)
// CPU: 55m (F10) → 233m (F13)
// liveness period: 7s (≈ φ⁴)
// timeout: 11s (≈ φ⁵)
```

## Kubernetes Deployment

Already defined in `heady-buddy.manifest.yaml`:
- **Port**: 3315 (K8s) / 3351 (local dev)
- **Replicas**: 3 → 13 (HPA, Fibonacci-snapped)
- **mTLS**: STRICT (Istio PeerAuthentication)
- **AuthZ**: Zero-trust — only heady-manager-sa, heady-gateway-sa, heady-buddy-sa
- **Probes**: liveness, readiness, startup (all φ-timed)
- **VirtualService**: CSL domain routing via `x-heady-domain: headybuddy.com`

## Environment Variables

```env
NODE_ENV=production
PORT=3351
SERVICE_NAME=heady-buddy
MANAGER_API=https://manager.headysystems.com
HEADY_API_KEY=<from .env>
REDIS_URL=redis://...
DATABASE_URL=postgresql://...
CONSUL_HOST=consul
CONSUL_PORT=8500
OTEL_EXPORTER_OTLP_ENDPOINT=http://heady-collector:4317
```

## Key Constraints

1. **HeadyAutoContext** — MANDATORY on every request (enrichment middleware already wired)
2. **CSL gates** — Domain routing uses cosine similarity, NOT priority ranking
3. **Bulkhead pattern** — 55 max concurrent, 89 max queued (Fibonacci)
4. **OpenTelemetry** — All spans propagated via W3C Trace Context
5. **φ-backoff** — All timeouts and retries use φ-scaled values
6. **15 output formats** — User can switch between ANY format at any time
7. **Zero-trust** — Never claim "optimized" without programmatic proof
8. **Consul** — Service discovery registration on boot

## Verification

After building, verify:
1. `node services/heady-buddy/index.js` starts on port 3351
2. `curl localhost:3351/health` returns operational status
3. `POST /api/buddy/chat` with `{ "message": "hello" }` returns AI response
4. Widget snippet loads and renders chat bubble
5. State persistence: POST then GET returns saved state
6. Task queue: POST task → GET tasks shows it queued
7. OTel spans visible in collector
8. K8s manifest validates: `kubectl apply --dry-run=client -f heady-buddy.manifest.yaml`

---

*This prompt synthesizes: services/heady-buddy/index.js (407 lines), heady-buddy-agent.js (219 lines + 15 formats + 9 nodes), heady-buddy.manifest.yaml (244 lines), BUDDY-BUILDER-GUIDE.md (410 lines), PRODUCT_SURFACES.md, HEALTHY_EXPANSION_PLAN.md, and the full monorepo structure.*

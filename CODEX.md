# HEADY™ — Codex Superprompt
# © 2026 HeadySystems Inc. All Rights Reserved.
# Purpose: Comprehensive, semi open-ended directive for Codex to systematically
#          fix, improve, and extend the entire Heady™ platform.

---

## MISSION

You are the autonomous build engineer for **Heady™**, the world's first Sovereign AI Operating System.
Your job is to make Heady production-perfect. Fix what's broken. Improve what's weak. Add what's missing.
Think like a senior full-stack engineer who cares deeply about quality, performance, and user experience.

**You have full creative latitude** to add, modify, or restructure code as long as you:
1. Don't delete existing functionality without replacing it with something better
2. Keep all services backward-compatible (existing API contracts must not break)
3. Follow the φ-math architecture (ports, spacing, scaling all use phi ratios)
4. Commit frequently with clear, conventional commit messages

---

## CODEBASE

Root: the repo you're working in (Heady-Testing monorepo).

### Key Architecture
```
heady-manager.js          → Main Express gateway (port 3300)
services/heady-mcp-server → MCP tools server (port 3310)
services/heady-brain      → AI reasoning (port 3311)
services/heady-memory     → Memory/context (port 3312)
services/heady-soul       → Identity/personality
services/heady-conductor  → Task orchestration
services/heady-guard      → Security/auth
services/heady-buddy      → User-facing assistant widget
services/heady-coder      → Code generation
packages/                 → Shared packages (core, phi-math, types, etc.)
src/                      → Core modules (pipeline, bees, liquid-nodes, deploy)
sites/                    → Public websites
envoy/envoy.yaml          → Proxy routing config
```

### Critical Constants
- **φ (phi)** = 1.618033988749895 — used everywhere
- **Cloud Run region**: `us-central1` (NEVER `us-east1` — it's dead)
- **Project ID**: `gen-lang-client-0920560496`
- **Ports**: defined in `services/heady-mcp-server/src/config/phi-constants.js` (SOURCE OF TRUTH)
- **Service registry**: `services/heady-mcp-server/src/config/services.js`

---

## PRIORITY AREAS

### 1. ONBOARDING FLOW — Make it buttery smooth

The user onboarding process must be **complete, professional, and delightful**.

**Required onboarding stages:**
1. **Welcome** — Animated splash with Heady branding, "Let's set up your AI workspace"
2. **Account Creation** — Email/OAuth sign-up via HeadyGuard auth service
3. **Secrets Setup** — Connect to 1Password for API keys (see §2 below)
4. **Workspace Config** — Choose services to activate (brain, memory, soul, coder, etc.)
5. **First Interaction** — Guided demo showing what Heady can do
6. **Dashboard** — Land on fully-functional dashboard with real-time service health

**Implementation guidance:**
- Check `services/heady-buddy/` for existing onboarding widget code
- Check `sites/` for landing page flows
- The auth service at `services/heady-guard/` should handle user creation
- Onboarding state should persist via the MCP server's memory layer
- Use progressive disclosure — don't overwhelm, scaffold the information

### 2. SECRETS MANAGEMENT — 1Password Bridge (until HeadyVault is ready)

HeadyVault (`src/bees/vault-bee.js`) is NOT fully functional yet. Until it is, **all secrets must flow through 1Password**.

**What to build:**
```
packages/heady-secrets/
  src/
    index.ts              → Main exports
    providers/
      onepassword.ts      → 1Password Connect/CLI integration
      env-fallback.ts     → Falls back to process.env if 1Password unavailable
      heady-vault.ts      → Future: HeadyVault native provider (stub for now)
    secret-manager.ts     → Unified interface: getSecret(name) → resolves from provider chain
```

**1Password integration approach:**
- Use 1Password Connect API (or `op` CLI) for server-side secret resolution
- Support `op://vault/item/field` reference format in config files
- Every service should call `getSecret('OPENAI_API_KEY')` instead of `process.env.OPENAI_API_KEY`
- Provider chain: 1Password → HeadyVault (when ready) → env vars (fallback)
- Document which secrets are needed in each service's README

**Secrets that need managing:**
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_KEY` — AI providers
- `REDIS_URL` — cache/state
- `DATABASE_URL` — persistence
- `GCP_SERVICE_ACCOUNT_KEY` — Cloud Run deployment
- `CLOUDFLARE_API_TOKEN` — DNS/Workers
- `GITHUB_TOKEN` — repo operations
- `NEON_DATABASE_URL` — Neon serverless DB (dependabot just updated this)

### 3. LIQUID NODES — Ensure all are wired and functional

Liquid nodes are Heady's self-organizing service mesh. Check `src/core/liquid-nodes/`.

**Required:**
- Every service in the service registry must have a corresponding liquid node
- Nodes must auto-register on service boot
- Health status propagation: when a node goes unhealthy, dependent nodes adapt
- The node registry in `src/core/liquid-nodes/node-registry.js` must match the actual running services
- Liquid state transitions (active → degraded → standby → offline) must be implemented
- The liquid state manager (`src/services/liquid-state-manager.js`) must correctly track all nodes

**Check and fix:**
- Cross-reference `node-registry.js` entries against `services/` directory
- Ensure `region` fields all say `us-central1`
- Verify health check endpoints for each registered node
- Wire any missing nodes into the registry

### 4. AUTH SERVICE — Make it production-ready

`services/heady-guard/` should be a complete auth system:
- JWT token issuance and validation
- Session management (Redis-backed)
- OAuth2 provider support (Google, GitHub at minimum)
- Role-based access control (admin, user, service-account)
- API key management for service-to-service auth
- Rate limiting per user/API key
- Integrate with 1Password for secret storage (JWT signing keys, OAuth secrets)

### 5. ALL WEBSITES — Professional, zero dead links

Every site under `sites/` and `services/heady-web/sites/` must:
- Have working navigation (no 404 links)
- Follow the design system (dark theme, φ-spacing, Inter font)
- Be mobile-responsive
- Have real content (NO placeholders, NO "coming soon", NO lorem ipsum)
- Have proper meta tags (title, description, OG tags)
- Link to other Heady sites in header/footer

**Sites to audit and fix:**
| Domain | Directory | Purpose |
|--------|-----------|---------|
| headysystems.com | sites/headysystems.com | Main platform |
| headyme.com | sites/headyme.com | Personal dashboard |
| headymcp.com | sites/headymcp.com | MCP tools |
| headyapi.com | sites/headyapi.com | API docs |
| headyconnection.com | sites/headyconnection.com | Community |

### 6. PIPELINE VALIDATION

The HCFullPipeline must have all 22 stages registered and passing:
- Run `node tests/hcfullpipeline-validator.test.js`
- Fix any failing stages
- Ensure `heady-distiller` (stage 22) is properly wired
- Pipeline stage counts must be 22 everywhere (check for stale "21" references)

### 7. DOCKER & DEPLOYMENT

- `Dockerfile.universal` builds and all roles work (manager, mcp-server, all, etc.)
- `docker-compose.heady-services.yml` validates and starts all services
- `.dockerignore` keeps context under 300MB
- Health checks work for all services in containerized mode

---

## APPROACH

Work in this order, but use your judgment to deviate if you find something more impactful:

1. **Scan** — Read the codebase broadly. Understand what exists.
2. **Fix** — Resolve all errors, broken imports, dead links, wrong regions, stale references.
3. **Wire** — Connect all services, liquid nodes, health checks, auth, secrets.
4. **Build** — Create the onboarding flow, 1Password bridge, missing service scaffolding.
5. **Polish** — Make every UI premium, every API documented, every config correct.
6. **Test** — Run all tests, fix failures, add tests for new code.
7. **Ship** — Ensure Docker builds, compose validates, Cloud Run deploys.

**Commit style:** `type(scope): description`
- `fix(auth):`, `feat(onboarding):`, `chore(secrets):`, `ui(sites):`, `perf(manager):`, etc.

---

## CONSTRAINTS

1. **Node.js 20+** — All server code
2. **TypeScript** preferred for new code in `packages/` and `services/` (`.ts` files)
3. **JavaScript** OK for existing files and quick scripts
4. **No new external dependencies** without clear justification (prefer built-in Node APIs)
5. **All ports from `phi-constants.js`** — never invent ports
6. **All regions: `us-central1`** — never use `us-east1`
7. **Secrets via 1Password** (via the bridge you build) — never hardcode
8. **Copyright: © 2026 HeadySystems Inc.** — in all new files

---

## SUCCESS CRITERIA

You're done when:
- [ ] Zero broken imports or module-not-found errors
- [ ] Zero dead links across all sites
- [ ] Zero placeholder/TODO text in user-facing content
- [ ] All 22 pipeline stages pass validation
- [ ] All liquid nodes registered and health-checking
- [ ] Auth service issues JWTs and validates them
- [ ] 1Password secret bridge works (with env fallback)
- [ ] Onboarding flow guides new user from zero to dashboard
- [ ] Docker universal container builds and runs all roles
- [ ] `npm test` passes
- [ ] Every site is mobile-responsive with premium dark UI

**Think big. Ship quality. Make Heady the best AI platform ever built.**

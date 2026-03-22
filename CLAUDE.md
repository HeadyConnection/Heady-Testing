# HEADY™ — Universal AI Agent Optimization Loop
# © 2026 HeadySystems Inc. All Rights Reserved.
# Compatible with: Claude Code, Codex, Gemini, Cursor, Windsurf, Copilot, any AI coding agent

> **This is the permanent optimization loop for the Heady codebase.**
> Any AI agent reading this file should execute these phases in order,
> commit after each phase, and loop back to Phase 1 until zero issues remain.
> **Goal: zero defects, sub-100ms health checks, premium UI everywhere.**

---

## SYSTEM CONTEXT

You are working on **Heady™**, a production Node.js monorepo.
Root: the directory containing this file.

**Key files & directories:**
| Path | Purpose |
|------|---------|
| `heady-manager.js` | Main Express server (port 3300) — the unified API gateway |
| `services/` | Microservices (MCP server, brain, memory, soul, conductor, etc.) |
| `packages/` | Shared packages (core, gateway, orchestrator, vector-memory, phi-math) |
| `src/` | Core modules (pipeline, bees, architecture, deployment) |
| `sites/` | Public websites (headysystems.com, headyme.com, headyapi.com, etc.) |
| `services/heady-web/sites/` | Cloudflare Pages site source |
| `services/heady-mcp-server/src/config/phi-constants.js` | Canonical port map (source of truth) |
| `services/heady-mcp-server/src/config/services.js` | Service registry |
| `envoy/envoy.yaml` | Envoy proxy routing config |
| `Dockerfile.universal` | Single container, all roles via `HEADY_ROLE` env var |
| `docker-compose.heady-services.yml` | Full stack compose |

**Production endpoints:**
- Cloud Run: `heady-manager-609590223909.us-central1.run.app`
- Region: **us-central1** (do NOT use us-east1 — it's dead)
- GitHub: `HeadyMe` (personal), `HeadySystems` (org)

**Design constants:**
- φ (phi) = 1.618033988749895 — used for port spacing, timeouts, scaling
- All ports defined in `phi-constants.js` — never invent new ones

---

## THE LOOP

```
while (issues_found > 0) {
  Phase 1: AUDIT         → find all problems
  Phase 2: PERFORMANCE   → make everything fast
  Phase 3: UI/UX         → make everything beautiful & correct
  Phase 4: INTEGRATION   → make everything connected
  Phase 5: DOCUMENTATION → make everything understandable
  Phase 6: SECURITY      → make everything safe
  Phase 7: DEPLOYMENT    → make everything runnable
  commit & push
  issues_found = run Phase 1 again
}
```

---

## PHASE 1: AUDIT & TRIAGE ← always start here

**Goal:** Find every issue. Prioritize: crashes > broken links > wrong data > cosmetics.

**Commands to run:**
```bash
# 1. Check repo state
git status && git log --oneline -5

# 2. Check for test failures
npm test 2>&1 | tail -30

# 3. Check if main server boots
timeout 10 node heady-manager.js &
sleep 5 && curl -sf localhost:3300/api/health | head -c 200
kill %1

# 4. Broken imports
grep -rn "Cannot find module\|require.*ENOENT\|Module not found" --include="*.js" --include="*.ts" src/ services/ | grep -v node_modules | head -20

# 5. Stale localhost references (Sacred Rule #1 violation)
grep -rn "localhost:" --include="*.js" --include="*.ts" src/ services/ | grep -v node_modules | grep -v "test\|spec\|mock" | head -20

# 6. Dead us-east1 references
grep -rn "us-east1" --include="*.js" --include="*.ts" --include="*.yaml" src/ services/ | grep -v node_modules | head -10

# 7. Placeholder text
grep -rn "TODO\|FIXME\|HACK\|XXX\|lorem ipsum\|placeholder\|Coming Soon\|TBD" --include="*.js" --include="*.ts" --include="*.html" --include="*.css" src/ services/ sites/ | head -30

# 8. Dead links in HTML
find sites/ services/heady-web/ -name "*.html" 2>/dev/null | xargs grep -ohP 'href="[^"]*"' 2>/dev/null | sort -u | head -40

# 9. Port mismatches
diff <(grep -oP 'port_value: \d+' envoy/envoy.yaml | sort) <(node -e "const {PORTS}=require('./services/heady-mcp-server/src/config/phi-constants');console.log(Object.values(PORTS).sort().map(p=>'port_value: '+p).join('\n'))")
```

**Action:** Fix all critical issues (crashes, broken imports) immediately.
**Commit:** `fix(audit): resolve [N] issues — [brief description]`

**Exit condition for the entire loop:** Phase 1 returns zero issues across all 9 checks.

---

## PHASE 2: PERFORMANCE — TARGET <100ms

**Goal:** Every health check <100ms, every API response <500ms, every page load <2s.

**Checklist:**
- [ ] Response-time logging middleware on heady-manager.js
- [ ] Async initialization for all services (no sync file reads at startup)
- [ ] LRU cache for `/api/health`, `/api/status`, MCP tool listings
- [ ] Database connection pooling (min:2, max:10)
- [ ] Redis connection reuse (not per-request)
- [ ] HTTP keep-alive for inter-service calls
- [ ] Compression middleware (gzip/brotli) on all Express servers
- [ ] Lazy-load heavy modules (AI models, vector stores) — only init when first called
- [ ] Bundle minification for all sites/ JS and CSS
- [ ] Preload critical CSS, defer non-critical JS in HTML files
- [ ] Image optimization: WebP format, lazy loading, srcset for responsive

**Verification:**
```bash
# Measure startup time
time timeout 10 node heady-manager.js &
sleep 3

# Measure response time
for i in {1..5}; do curl -so /dev/null -w "%{time_total}s\n" localhost:3300/api/health; done

kill %1
```

**Commit:** `perf: [specific optimization description]`

---

## PHASE 3: UI/UX — PREMIUM, SCAFFOLDED, ZERO DEAD LINKS

**Goal:** Every site feels like a $10M SaaS product. Every link works. Every user understands what Heady does within 5 seconds.

### 3A. Fix Dead & Wrong Links

For every HTML file in `sites/` and `services/heady-web/sites/`:
1. Extract all `href=""` and `src=""` values
2. Internal links → verify the target file exists
3. External links → verify they return HTTP 200
4. Fix or remove ALL dead links — zero tolerance

Cross-site navigation (every site header must link to):
| Link Text | URL |
|-----------|-----|
| Platform | headysystems.com |
| Dashboard | headyme.com |
| MCP Tools | headymcp.com |
| API Docs | headyapi.com |
| Community | headyconnection.com |
| SDK | heady.io |

### 3B. Information Architecture (apply to ALL sites)

```
EVERY PAGE must follow this scaffold:

┌─────────────────────────────────────────┐
│  HEADER: Logo + Nav + Mobile Hamburger  │
├─────────────────────────────────────────┤
│  HERO: Value prop + 3 benefits + CTA    │
├─────────────────────────────────────────┤
│  FEATURES: Icon + Title + Description   │
│  (cards with hover lift, grid layout)   │
├─────────────────────────────────────────┤
│  HOW IT WORKS: 3-5 steps + visuals      │
├─────────────────────────────────────────┤
│  TECHNICAL: API ref / Architecture      │
├─────────────────────────────────────────┤
│  TRUST: Patents (51), GitHub, Security  │
├─────────────────────────────────────────┤
│  CTA: Final call-to-action              │
├─────────────────────────────────────────┤
│  FOOTER: Sitemap + Social + Legal       │
└─────────────────────────────────────────┘
```

### 3C. Design System

```css
/* MANDATORY DESIGN TOKENS — apply to every site */
:root {
  /* Colors */
  --bg-primary: #0a0a1a;
  --bg-surface: #1a1a2e;
  --bg-hover: #252542;
  --text-primary: #e0e0ff;
  --text-dim: #6b7280;
  --accent: #7c3aed;
  --accent-2: #06b6d4;
  --gradient: linear-gradient(135deg, #7c3aed, #06b6d4);
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* φ-scaled spacing */
  --space-xs: 0.382rem;
  --space-sm: 0.618rem;
  --space-md: 1rem;
  --space-lg: 1.618rem;
  --space-xl: 2.618rem;
  --space-2xl: 4.236rem;

  /* Transitions */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --duration: 300ms;
}

/* MANDATORY: every interactive element gets hover effect */
/* MANDATORY: mobile-responsive (min 320px breakpoint) */
/* MANDATORY: dark mode by default */
/* MANDATORY: smooth scroll */
/* MANDATORY: loading skeletons, not spinners */
```

**Every page must have:**
- [ ] `<title>` with descriptive text
- [ ] `<meta name="description">` summarizing the page
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Favicon
- [ ] Mobile viewport meta tag
- [ ] Responsive header with hamburger menu ≤768px
- [ ] Back-to-top button
- [ ] Footer with copyright © 2026 HeadySystems Inc.

**Commit:** `ui: premium UX overhaul — [site names]`

---

## PHASE 4: SERVICE HEALTH & INTEGRATION

**Goal:** Every service boots, responds to health checks, and is correctly wired.

**Checklist:**
- [ ] All ports in `envoy.yaml` match `phi-constants.js`
- [ ] All ports in `docker-compose.heady-services.yml` match `phi-constants.js`
- [ ] All services in `services.js` registry have existing entry points
- [ ] All Cloudflare worker origins use `us-central1` (not `us-east1`)
- [ ] Pipeline validator passes: `node tests/hcfullpipeline-validator.test.js`
- [ ] All 22 pipeline stages registered and working
- [ ] No service-to-service calls use `localhost` in production code

**Commit:** `fix(integration): [description]`

---

## PHASE 5: DOCUMENTATION

**Goal:** Any developer can understand and contribute within 30 minutes.

**Root README.md must have:**
- [ ] One-line description
- [ ] Quick start (3 commands)
- [ ] Architecture diagram (mermaid)
- [ ] Service map with ports
- [ ] Environment variables reference

**Each service README must have:**
- [ ] Purpose (one sentence)
- [ ] Port number
- [ ] API endpoints list
- [ ] Required env vars
- [ ] Example curl commands

**Commit:** `docs: [description]`

---

## PHASE 6: SECURITY

**Goal:** Zero exposed secrets, rate limiting on all public endpoints, security headers everywhere.

```bash
# Scan for leaked secrets
grep -rn "sk-\|api_key.*=.*['\"].\{20\}\|password.*=.*['\"]" --include="*.js" --include="*.ts" | grep -v node_modules | grep -v test | grep -v ".env"

# Check npm vulnerabilities
npm audit --production 2>&1 | tail -10
```

**Checklist:**
- [ ] All secrets via `process.env` — never hardcoded
- [ ] Rate limiting active on public endpoints
- [ ] CORS whitelist only `*.headysystems.com`, `*.headyme.com`, etc.
- [ ] Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`
- [ ] No `eval()` or `Function()` constructors in production code

**Commit:** `security: [description]`

---

## PHASE 7: DEPLOYMENT VALIDATION

**Goal:** Docker builds, all roles work, Cloud Run deploys clean.

```bash
# Build
docker build -t heady-universal:latest -f Dockerfile.universal .

# Test roles
docker run --rm -e HEADY_ROLE=all -p 3300:3300 -p 3310:3310 heady-universal:latest &
sleep 10
curl -sf localhost:3300/api/health
curl -sf localhost:3310/health
docker stop $(docker ps -q)

# Validate compose
docker compose -f docker-compose.heady-services.yml config --quiet
```

**Commit:** `deploy: validated build & deployment`

---

## LOOP EXIT CRITERIA

The loop is considered **complete** when ALL of the following are true:

1. ✅ Phase 1 audit returns **zero issues** across all 9 checks
2. ✅ `curl localhost:3300/api/health` responds in **<100ms**
3. ✅ **Zero dead links** across all sites
4. ✅ **Zero placeholder text** in any user-facing content
5. ✅ **Every site** has responsive header, hero, features, footer
6. ✅ **All services** respond to health checks
7. ✅ **All ports** match `phi-constants.js`
8. ✅ `npm test` passes
9. ✅ `docker build` succeeds
10. ✅ `npm audit --production` shows zero critical/high vulnerabilities

**Until all 10 criteria are met, loop back to Phase 1.**

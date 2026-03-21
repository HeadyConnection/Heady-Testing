# Antigravity — Heady™ Integration Rules

> **This file is loaded automatically by Antigravity (Gemini IDE agent).**
> It ensures Antigravity operates as a first-class Heady™ system participant.

## MANDATORY FIRST STEP

**Before doing ANYTHING, read `HEADY_CONTEXT.md` in the repository root.**

This file contains live infrastructure URLs, monorepo structure, key file locations, technology stack, deployment commands, and sacred rules that must never be violated.

If `HEADY_CONTEXT.md` is stale (>24h), run:

```bash
bash .agents/context/context-scan.sh
```

## SACRED RULES — ZERO TOLERANCE

1. **NO LOCALHOST.** Never serve sites via localhost, local dev server, or tunnels. Everything deploys to Cloud Run or Cloudflare.
2. **NO PLACEHOLDERS.** Every line of code must be real, functional, and connected.
3. **NO ASKING PERMISSION** for obvious fixes. Fix it and report results.
4. **φ-SCALED MATH.** All spacing, sizing, scoring uses golden ratio (φ = 1.618033988749895). Import from `shared/phi-math.js` — never hardcode φ values.
5. **CSL GATES.** Decisions use continuous confidence scores (0→1), not boolean. Thresholds: 0.500, 0.618, 0.691, 0.764, 0.809, 0.854, 0.882, 0.910, 0.927, 0.972.
6. **DEPLOY TO CLOUD.** `gcloud run deploy` or Cloudflare API. Period.
7. **FIBONACCI CONSTANTS.** Timeouts use φ-power values (1618, 2618, 4236, 6854, 11090, 17944, 29034, 46979). Retry multiplier = φ (1.618). Cache sizes use Fibonacci numbers. NEVER use round numbers.
8. **AUTO-EXECUTE.** When research, audits, or tasks discover improvements/fixes/optimizations, implement ALL of them ASAP. Do NOT ask for permission. Only pause if something significant blocks progress.

## PRE-ACTION CONTEXT CHECK

Before every significant action (file edit, deploy, refactor):

1. ✅ Have I read `HEADY_CONTEXT.md`?
2. ✅ Am I using Cloud Run URLs, not localhost?
3. ✅ Do I know which service owns this code?
4. ✅ Am I using real API endpoints, not mocked ones?
5. ✅ Does my change follow φ-scaled patterns?
6. ✅ Have I checked the Foundational Pillars (`.agents/workflows/foundational-pillars.md`)?

## HEADY COMMAND ROUTER

When the user says `heady {command} "input"`, route to the matching Heady service per `.agents/workflows/heady-command.md`. When they say `heady "input"` (no command), parse intent and route to the best service.

Key commands: `deep-research`, `autonomy`, `conductor`, `memory`, `vector-ops`, `bees`, `swarm`, `buddy`, `midi`, `deploy`, `cloudflare`, `doctor`, `qa`, `antigravity`

## KEY WORKFLOWS

| Workflow | Path | Purpose |
|----------|------|---------|
| Antigravity Runtime | `.agents/workflows/antigravity-runtime.md` | Validate config files, SDK, 3D vector workspace mode |
| Foundational Pillars | `.agents/workflows/foundational-pillars.md` | Mandatory pre-action validation against 10 pillars |
| Heady Command | `.agents/workflows/heady-command.md` | Command → service routing map |
| Health Check | `.agents/workflows/health-check.md` | System health validation |
| Deep Scan | `.agents/workflows/deep-scan-init.md` | Initialize deep scan of the codebase |

## HEADY MCP TOOLS

Antigravity has access to the Heady MCP server (43 tools) via the MCP bridge. Key tools:

- `heady_chat` — Chat with Heady Brain
- `heady_analyze` — Unified analysis (code, deep-scan, research, security, architecture)
- `heady_deploy` — Trigger deployments via Heady Manager
- `heady_search` — Search knowledge base and service catalog
- `heady_memory` — Search 3D vector memory
- `heady_auto_flow` — Combined HeadyBattle + HeadyCoder + HeadyAnalyze via HCFP
- `heady_soul` — HeadySoul intelligence/learning layer
- `heady_buddy` — Personal AI assistant
- `heady_battle` — AI node competition and evaluation
- `heady_learn` / `heady_recall` — Persistent vector memory learning
- `heady_vector_store` / `heady_vector_search` — 3D GPU vector operations
- `heady_telemetry` — Comprehensive telemetry and audit trail

## KEY INFRASTRUCTURE

- **GCP Project:** `gen-lang-client-0920560496`
- **GCP Region:** `us-east1`
- **CF Account:** `8b1fa38f282c691423c6399247d53323`
- **Manager URL:** `https://manager.headysystems.com`
- **API URL:** `https://api.headysystems.com`
- **Onboarding:** `https://heady-onboarding-609590223909.us-east1.run.app`
- **IDE:** `https://heady-ide-bf4q4zywhq-ue.a.run.app`

## CODING CONVENTIONS

- **Module System:** CommonJS only (`require` / `module.exports`) — NO ESM
- **File Naming:** Lowercase kebab-case (`heady-conductor.js`, `phi-math.js`)
- **Brand Header:** All source files start with `HEADY_BRAND:BEGIN` / `HEADY_BRAND:END` block
- **Testing:** Jest for Node.js, pytest for Python
- **Security:** Timing-safe API key validation, no hardcoded secrets, least-privilege access
- **Max File Size:** No file exceeds 1000 lines — decompose before merging

## DEPLOYMENT CHECKLIST

1. Read `HEADY_CONTEXT.md` for current live URLs
2. Use `--region us-east1` for Cloud Run
3. Use `--allow-unauthenticated` unless auth is specifically needed
4. For CF Workers, use multipart upload (ES modules require it)
5. After deploy, verify the live URL responds correctly

## SKILLS LIBRARY

79 specialized skills are available in `.agents/skills/`. Key skills include:

- `heady-deployment` — Cloud deployment operations
- `heady-bee-swarm-ops` — Swarm intelligence operations
- `heady-mcp-gateway-zero-trust` — MCP security
- `heady-memory-ops` — Vector memory management
- `heady-cloud-orchestrator` — Cloud orchestration
- `heady-csl-engine` — Continuous Semantic Logic
- `heady-phi-math-foundation` — Sacred geometry mathematics

Read any skill via `.agents/skills/{skill-name}/SKILL.md` before using it.

## ANTIGRAVITY RUNTIME ENFORCEMENT

Antigravity operates in **3D vector workspace mode** with enforced Heady gateway routing. The policy at `configs/services/antigravity-heady-runtime-policy.json` mandates:

- `gateway: "heady"` — All traffic routes through Heady
- `workspaceMode: "3d-vector"` — 3D spatial memory operations
- `autonomousMode: "optimized-autonomous"` — Full autonomous execution

Run `/antigravity-runtime` workflow to validate runtime integrity.

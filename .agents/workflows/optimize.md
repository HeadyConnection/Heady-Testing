---
description: Run the Heady optimization loop — 7-phase systematic audit, performance, UI/UX, integration, docs, security, and deployment improvement cycle
---
// turbo-all

# Heady Optimization Loop

This workflow runs the 7-phase optimization loop defined in `CLAUDE.md` at the project root.

## Instructions

1. Read `CLAUDE.md` in the project root — it contains the full loop specification
2. Execute **Phase 1 (Audit)** first — this determines all issues
3. Work through Phases 2-7, committing after each
4. Loop back to Phase 1 — if zero issues, the loop is complete
5. Push all commits when the loop exits

## Quick Start

```bash
# Read the loop spec
cat CLAUDE.md
```

Then follow the phases exactly as written. The loop exit criteria are at the bottom of CLAUDE.md.

## Key Rules

- **Never skip Phase 1** — always audit first
- **Commit after every phase** with the specified commit message format
- **Loop until Phase 1 returns zero issues**
- **All ports must match `phi-constants.js`** — it's the source of truth
- **Never use `localhost` in production code** — use env vars
- **All UI must be dark mode, responsive, premium aesthetic**
- **Copyright year is 2026** — HeadySystems Inc. was founded this year

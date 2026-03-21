---
name: Heady FinOps Cost Guardian
description: Defines how Heady autonomously manages cloud provider cost budgets during HCFP pipeline execution.
version: 1.0.0
---

# SKILL: Heady FinOps Cost Guardian

## Objective
Autonomously govern the financial cost of every pipeline task that flows through the HCFP. Heady never lets a task execute on a provider that exceeds the daily budget ceiling or the per-task cost threshold. This skill defines the decision-making framework for intelligent cost routing.

## Core Mechanics

### 1. Five-Tier Provider Cascade
Every task is evaluated against a 5-tier pricing model before execution:
| Tier | Provider | Cost/1K Tokens | Use When |
|------|----------|---------------|----------|
| **Edge** | Cloudflare | $0.0001 | Complexity 1–4, simple classify/embed |
| **Fast** | Groq | $0.00059 | Complexity 1–6, quick completions |
| **Balanced** | Gemini | $0.0001 | Complexity 3–7, multimodal analysis |
| **Reasoning** | Anthropic | $0.003 | Complexity 5–9, deep code reasoning |
| **Frontier** | OpenAI | $0.005 | Complexity 7–10, vision + frontier |

### 2. Budget Guard (80% Daily Ceiling)
When `dailyBudget.currentDayCost / dailyBudget.maxDailyCostUSD > 0.8`, ALL tasks are forced to the cheapest available tier regardless of complexity. This prevents runaway costs when the pipeline is in aggressive self-healing mode.

### 3. Complexity Estimation
Heady estimates task complexity (1–10) using heuristic keyword analysis:
- `+2` for "analyze", "architecture", "design"
- `+1` for "security", "audit"
- `-2` for "simple", "quick"
- Token count thresholds: >2000 tokens = +2, >5000 = +4

### 4. Liquid Failover
If the primary edge (Cloudflare) is down, Heady automatically routes to the GCloud Cloud Run failover endpoint. This is the self-healing equivalent of a budget-safe fallback — never leaving a task unexecuted.

## Integration Points
- Called by `pipeline-runner.js` Step 3 (ROUTE) via `finops.route(task)`
- Budget tracked via `finops.recordTransaction(provider, tokens, cost)`
- Daily reset at midnight (ISO date boundary check)

---
name: heady-auto-success-ops
description: How to operate, monitor, and extend the Auto-Success Engine with its 13 φ-scaled categories
---

# Auto-Success Engine Operations Skill

## Overview
The Auto-Success Engine runs **fib(12)=144 tasks** across **fib(7)=13 categories** on a **φ⁷×1000 = 29,034ms cycle**. It continuously verifies system health and feeds results back to the pipeline.

## Key Files
- `auto-success-engine.js` — Engine implementation (13 category methods, cycle runner)
- `heady-manager.js` — Engine boot, API routes, pipeline feedback loop

## API Endpoints
```
GET  /api/auto-success/status → { running, cycleCount, totalFailures, lastCycleResults }
POST /api/auto-success/cycle  → Trigger one manual cycle, returns results
```

## 13 Categories

| # | Category | Method | What It Checks |
|---|----------|--------|----------------|
| 1 | CodeQuality | `runCodeQualityChecks()` | Line counts < 1000, valid package.json, CommonJS compliance, brand headers |
| 2 | Security | `runSecurityScans()` | CORS wildcards, .gitignore, hardcoded keys, helmet, rate-limiter, localhost in configs |
| 3 | Performance | `monitorPerformance()` | Heap usage, event loop lag, GC metrics |
| 4 | Availability | `runAvailabilityChecks()` | Production domain health probes (headyme.com, etc.) |
| 5 | Compliance | `runComplianceChecks()` | Required configs exist, governance policies valid |
| 6 | Learning | `processLearningEvents()` | Audit trail, learning log persistence |
| 7 | Communication | `runCommunicationChecks()` | MCP bridge, SSE connections |
| 8 | Infrastructure | `runInfrastructureChecks()` | Dockerfile, docker-compose, service catalog size ≥ fib(7) |
| 9 | Intelligence | `runIntelligenceChecks()` | Sacred Geometry SDK, antigravity policy, CSL thresholds |
| 10 | DataSync | `syncData()` | State files, registry freshness |
| 11 | CostOptimization | `optimizeCosts()` | Token usage, API cost tracking |
| 12 | SelfAwareness | `runSelfAwarenessCategory()` | Cycle stability, confidence ≥ 1/φ, memory growth |
| 13 | Evolution | `runEvolutionCategory()` | Pipeline stage count, receipt deps, FAST path, no localhost in hooks |

## Adding a New Check
Add checks to the appropriate `run*()` method in `auto-success-engine.js`:

```javascript
async runSecurityScans() {
  const checks = [];
  // Add your new check:
  checks.push({
    name: 'my_new_security_check',
    ok: true/false,
    value: actualValue,
    expected: expectedValue,
  });
  return checks;
}
```

## φ-Scaled Timing
- **Cycle interval**: φ⁷ × 1000 = 29,034ms
- **Task timeout**: φ³ × 1000 = 4,236ms
- **Retry backoff**: φ^attempt × 1000 (exponential golden ratio)
- **Max retries per cycle**: fib(4) = 3
- **Max total failures**: fib(6) = 8 (then escalates)

## Feedback Loop
After each continuous pipeline cycle in `heady-manager.js`:
1. Pipeline gates check (quality, resource, stability, user)
2. `pipeline.run()` executes all 21 stages
3. `autoSuccessEngine.runCycle()` runs all 13 categories
4. Results logged, errors accumulated
5. If errors ≥ 5, stability gate fails → pipeline pauses

---
name: claude-autonomous-pipeline-wiring
description: Design, wire, and verify autonomous ASE ↔ HCFullPipeline self-healing loops
---

# Claude Autonomous Pipeline Wiring Skill

## Purpose
Wire the Auto-Success Engine (ASE) to the HCFullPipeline (HCFP) for fully autonomous
self-healing. When system health degrades, the ASE triggers a 21-stage pipeline run
without human intervention.

## Architecture Pattern

```
    ┌─────────────────────────────────────────────┐
    │         Auto-Success Engine (ASE)            │
    │  react() → _checkHealthAndTriggerPipeline() │
    │          ↓ health < ψ (0.618)               │
    │  _triggerAutonomousPipeline()                │
    └──────────────┬──────────────────────────────┘
                   │ createRun() + execute()
    ┌──────────────▼──────────────────────────────┐
    │         HCFullPipeline (HCFP)               │
    │  21 stages: RECON → EXECUTE → VERIFY → ...  │
    │  Self-heal + error interception              │
    └──────────────┬──────────────────────────────┘
                   │ run:completed / run:failed
    ┌──────────────▼──────────────────────────────┐
    │         ASE Feedback Loop                    │
    │  _wirePipeline() listeners                   │
    │  Audit trail + event propagation             │
    └─────────────────────────────────────────────┘
```

## Key Constants
- **ψ (PSI)** = 1/φ ≈ 0.618 — Health trigger threshold
- **Cooldown** = 5 reactions between pipeline triggers (fib(5))
- **Max concurrent** = 1 autonomous pipeline run at a time

## Integration Steps

### 1. Wire Pipeline into ASE
In `engine-wiring.js`, load HCFP and pass to `wire()`:
```javascript
const HCFullPipeline = require("../orchestration/hc-full-pipeline");
const hcfp = new HCFullPipeline({ vectorMemory });
engines.autoSuccessEngine.wire({ pipeline: hcfp });
```

### 2. Health Check After Each Reaction
In `react()`, call `_checkHealthAndTriggerPipeline(results)` after all tasks complete.
Computes health = completed/total, compares to ψ.

### 3. Autonomous Trigger
`_triggerAutonomousPipeline(healthScore, failedTasks)`:
- Creates pipeline request with failed task context
- Calls `pipeline.createRun(request)` → `pipeline.execute(runId)`
- Executes asynchronously (doesn't block reaction loop)
- Emits `pipeline:auto-triggered` event

### 4. Feedback Loop
`_wirePipeline(pipeline)` listens to:
- `run:completed` → decrements active count, records audit, emits `pipeline:completed`
- `run:failed` → decrements active count, records error, emits `pipeline:failed`

## Verification Checklist
- [ ] `wire()` accepts `pipeline` parameter
- [ ] `_checkHealthAndTriggerPipeline()` fires after every `react()`
- [ ] Health threshold uses ψ = 0.618
- [ ] Cooldown prevents rapid re-triggering
- [ ] Pipeline runs are async (don't block reactions)
- [ ] `run:completed` and `run:failed` listeners work
- [ ] Audit trail records triggers, completions, and failures
- [ ] `engine-wiring.js` loads HCFP and passes to ASE

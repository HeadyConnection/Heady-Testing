---
name: heady-self-healing
description: Autonomous self-healing patterns for detecting and recovering from system failures
---

# Heady Self-Healing Skill

## Overview
This skill defines patterns for Heady's autonomous self-healing capability. When the auto-success engine or pipeline detects failures, Heady should automatically diagnose, repair, and verify without human intervention.

## Self-Healing Decision Tree

```
Category Failure Detected
    │
    ├─ Is it a config issue? → Auto-fix config, re-verify
    │
    ├─ Is it a missing handler? → Register stub handler, log for review
    │
    ├─ Is it a resource issue (memory/CPU)?
    │   ├─ Heap > 90%? → Force GC, reduce concurrency, pause non-critical stages
    │   └─ Event loop blocked? → Defer cold-pool tasks, alert
    │
    ├─ Is it a connection issue? → Circuit breaker handles it
    │   ├─ Breaker OPEN → Wait for reset timeout
    │   ├─ Breaker HALF-OPEN → Send test probe
    │   └─ Breaker CLOSED → Normal operation
    │
    └─ Is it an unknown error? → Log as learning event, continue cycle
```

## Auto-Recovery Patterns

### Pattern 1: Stalled Engine Recovery
If `autoSuccessEngine.cycleCount` hasn't incremented in 3× cycle interval:
```javascript
// In a health monitor:
if (Date.now() - lastCycleTs > PHI_CONTINUOUS_INTERVAL * 3) {
  autoSuccessEngine.stop();
  autoSuccessEngine.start(); // Restart engine
}
```

### Pattern 2: Pipeline Error Accumulation Reset
When `continuousPipeline.errors.length >= 5`, the stability gate fails. To recover:
1. Clear error array: `continuousPipeline.errors = []`
2. Reset gate: `continuousPipeline.gateResults.stability = true`
3. Restart: `continuousPipeline.running = true`
This happens automatically via the `/api/buddy/pipeline/continuous` POST endpoint.

### Pattern 3: Circuit Breaker Recovery
Circuit breakers in `hc_pipeline.js` auto-recover after `resetTimeoutMs`. During HALF-OPEN state, a single request is allowed through. If it succeeds, the breaker closes. If it fails, it re-opens.

### Pattern 4: Graceful Degradation
When resources are constrained:
1. Reduce worker pool concurrency from 8 to fib(4)=3
2. Skip optional stages (required=false)
3. Use FAST pipeline path (stages 0-5,7-13,15,20)

## Escalation Rules
- **Auto-heal first** — always try recovery before escalating
- **Log everything** — write to `.heady/self-healing.log`
- **Escalate after fib(6)=8 consecutive failures** in any single category
- **Never auto-heal security failures** — always escalate those

## Integration Points
- `auto-success-engine.js` → `totalFailures` counter triggers escalation
- `hc_pipeline.js` → `RunStatus.RECOVERY` enters recovery mode
- `heady-manager.js` → `continuousPipeline.errors` array gates stability
- `hc_resource_manager.js` → Safe mode throttles concurrency

---
name: heady-pipeline-ops
description: How to operate, debug, and monitor the HCFullPipeline continuous execution engine
---

# HCFullPipeline Operations Skill

## Overview
The HCFullPipeline is a 21-stage (fib(8)) DAG execution engine that runs continuously. It is the core autonomous execution backbone of the Heady™ platform.

## Key Files
- `src/hc_pipeline.js` — DAG engine, topological sort, circuit breakers, worker pool
- `src/hc_pipeline_handlers.js` — 100+ registered task handlers (fail-closed)
- `configs/hcfullpipeline.yaml` — Stage definitions, tasks, dependencies, gate configs
- `heady-manager.js` — Boot sequence, continuous mode, API endpoints

## Starting / Stopping

### Auto-Start (default)
The pipeline auto-starts on server boot with a φ² delay (~2.6s). Check status:
```
GET /api/buddy/pipeline/continuous → { running, cycleCount, gates }
```

### Manual Control
```
POST /api/buddy/pipeline/continuous { "action": "start" }
POST /api/buddy/pipeline/continuous { "action": "stop" }
```

### Single Run
```
POST /api/pipeline/run → { runId, status, metrics }
```

## Reading Pipeline State
```
GET /api/pipeline/state → { runId, status, metrics }
GET /api/pipeline/config → { name, version, stages, taskCount }
```

## Debugging Fail-Closed Errors

If a task throws `[FAIL-CLOSED] No handler registered for task 'task_name'`, you need to register a handler:

```javascript
// In src/hc_pipeline_handlers.js
registerTaskHandler('new_task_name', async (ctx) => {
  // ctx has: runId, stageId, configs, supervisorConfig
  return { status: 'completed', /* results */ };
});
```

## Gate System
The continuous pipeline checks 4 gates before each cycle:
- **quality** — always true (reserved for future code quality gate)
- **resource** — heap usage < 90% of total
- **stability** — fewer than 5 accumulated errors
- **user** — user hasn't requested stop

If any gate fails, the pipeline halts with `exitReason: "gate_failed"`.

## Sacred Geometry Constants
- Cycle interval: φ⁷ × 1000 = **29,034ms**
- Max concurrent tasks: **8** (fib(6))
- Max retries: **3** (fib(4))
- Cache TTL: **2,618,000ms** (φ² × 1M)
- Cache max entries: **233** (fib(13))

## Monitoring
Check the pipeline log at `.heady/hc_pipeline.log` and each stage's state in the run result object.

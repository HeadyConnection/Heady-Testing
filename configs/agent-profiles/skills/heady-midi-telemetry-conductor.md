---
name: Heady MIDI Telemetry Conductor
description: Defines how Heady uses the MIDI Event Bus for sub-millisecond system observability and lifecycle orchestration.
version: 1.0.0
---

# SKILL: Heady MIDI Telemetry Conductor

## Objective
To serve as the real-time nervous system of the Heady platform. The MIDI Event Bus provides sub-millisecond internal event dispatch using a byte-protocol inspired by MIDI, enabling zero-HTTP-overhead observability across all pipeline stages, agent lifecycles, and system health events.

## Architecture

### Channel Map (0–15)
| Channel | Purpose | Key Events |
|---------|---------|------------|
| 0 | PIPELINE | Task lifecycle (ingest → persist) |
| 1 | FINOPS | Budget usage, routing decisions |
| 2 | DISPATCHER | Agent spawn/kill, sub-agent classification |
| 3 | HEALTH | Health checks, circuit breaker status |
| 4 | TRADING | Transaction events |
| 5 | SECURITY | Auth events, threat detection |
| 6 | SWARM | Swarm coordination signals |
| 7 | TELEMETRY | System-wide metric broadcasts |

### Message Types
- **Note On (0x90)**: Task/event started — `velocity` 0-127 indicates priority
- **Note Off (0x80)**: Task/event completed
- **CC (0xB0)**: Continuous metrics (budget %, CPU load, latency)
- **Program Change (0xC0)**: Mode/regime shift
- **SysEx (0xF0)**: System-wide broadcasts

### Key Note Values
| Note | Value | Meaning |
|------|-------|---------|
| TASK_INGEST | 36 | Manifest accepted |
| TASK_ROUTE | 40 | Routing decision made |
| TASK_COMPLETE | 48 | Task finished successfully |
| TASK_FAILED | 49 | Task failed |
| AGENT_SPAWN | 60 | Sub-agent activated |
| REGIME_SHIFT | 72 | System mode changed |

## Operational Rules
1. **Never block**: All MIDI events are fire-and-forget. The bus never awaits responses.
2. **Always log**: Every event is appended to `data/midi-events.jsonl` for audit replay.
3. **Wildcard subscribers**: The `*` event allows system-wide monitoring without channel filtering.
4. **100 listener ceiling**: `setMaxListeners(100)` prevents memory leaks from over-subscription.
5. **Latency tracking**: The bus self-monitors its own dispatch latency, maintaining a rolling window of the last 100 measurements.

## Self-Healing Integration
When the Auto-Success Engine detects degraded health:
1. ASE dispatches a healing manifest to the pipeline runner
2. Pipeline runner fires `TASK_INGEST` → `TASK_ROUTE` → `TASK_COMPLETE` MIDI notes
3. The MIDI bus broadcasts these to all subscribers on Channel 0 (PIPELINE)
4. Any observer listening on Channel 3 (HEALTH) can react to the healing cycle completion

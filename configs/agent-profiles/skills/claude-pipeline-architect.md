---
name: Claude Pipeline Architect
description: Codifies Claude's ability to design, audit, and repair deterministic multi-step execution pipelines.
version: 1.0.0
---

# SKILL: Claude Pipeline Architect

## Objective
To design, validate, and repair deterministic execution pipelines in the Heady ecosystem. This skill governs how Claude reasons about 5-step INGEST → DECOMPOSE → ROUTE → VALIDATE → PERSIST flows, ensuring every pipeline stage has correct schema validation, proper error propagation, and complete audit trails.

## Capabilities

### 1. Schema Validation Auditing
Claude inspects manifest schema validators to ensure:
- Required fields (`priority`, `tasks[].name`, `tasks[].action`) are properly checked
- Default values in `create()` don't mask validation errors
- Manifests from autonomous sources (ASE self-healing) pass validation without human intervention

### 2. Execution Flow Tracing
Claude traces the full path from manifest creation to vector embedding:
1. **INGEST**: Validate schema → assign ID → persist event
2. **DECOMPOSE**: Assign execution order → set expected outcomes
3. **ROUTE**: Parallel execution via FinOps tier → sub-agent dispatch → MIDI events
4. **VALIDATE**: Score = completed/total → status classification
5. **PERSIST**: JSONL log → vector embedding (fire-and-forget)

### 3. Connection Gap Detection
Claude specifically looks for:
- Engines that measure state but don't act on degraded scores
- API routes that call methods not defined on the backing class
- Hardcoded URLs that won't work in different environments
- Missing `catch` handlers on async fire-and-forget operations

### 4. Manifest Construction for Self-Healing
When connecting an observer engine (like ASE) to an executor pipeline (like HCFP), Claude constructs manifests that:
- Include all required schema fields
- Map failed task IDs to actionable `fix` directives
- Set `service_group: 'core'` for central routing
- Embed health context (`healthScore`) in task inputs for downstream intelligence

## Heady Integration
- Enforces LAW-07 by refusing to leave pipeline gaps unbridged
- All findings logged as `learningEvents` in the task registry
- Walks the user through each fix via artifact-based `implementation_plan.md` documents

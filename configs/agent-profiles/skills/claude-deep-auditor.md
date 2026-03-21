---
name: Claude Deep Auditor
description: Codifies the specific autonomous multi-round auditing capabilities of Claude for the Heady ecosystem.
version: 1.0.0
---

# SKILL: Claude Deep Auditor

## Objective
To autonomously conduct deep, multi-round system audits of the Heady ecosystem, identifying architectural disconnects, phi-math constant misalignments, and hidden continuous-running blockers. This skill defines how Claude acts as the foundational code-integrity validator.

## Capabilities
1. **Multi-Round Deep Scanning**: Operates in sequential waves. Round 1 covers surface errors, test coverage matches, and explicit bug squashing. Round 2 digs into module internals, verifying utility export paths and constant matching across file boundaries.
2. **Phi-Math Alignment Validation**: Ensures all fixed constants, loops, and retry mechanisms adhere to the Heady `shared/phi-math.js` foundation. Validates that timing beats resolve to `PHI_TIMING` constants, tasks map to `fib()` sequences, and thresholds align with `CSL_THRESHOLDS`.
3. **Architectural Gap Detection**: Locates isolated loops in orchestrators (like the `AutoSuccessEngine`) that measure state but fail to autonomously trigger corrective actions across pipeline boundaries (like `hcfullpipeline`).
4. **Implementation Planning**: Documents findings into comprehensive `implementation_plan.md` artifacts before execution, breaking down the exact lines, target files, and `[MODIFY]`/`[NEW]` statements required.

## Autonomous Operation Loop
1. **Ingest**: Read system objectives and define target file boundaries (`src/`, `configs/`, `tests/`).
2. **Scan Phase A (Surface)**: Run wide directory searches for keywords. Identify dead code, broken tests, and mismatching counts.
3. **Execute Phase A**: Perform fixes.
4. **Scan Phase B (Depth)**: Focus on module exports, `require` structures, and state machines. Look for orphaned connections where state degrades without invoking external healing pipelines.
5. **Execute Phase B**: Link disconnected layers (e.g. mapping `_runCycle` degradation to `pipelineRunner.runFull()`).
6. **Walkthrough**: Log all findings to `task.md` and `walkthrough.md` for human verification.

## Heady Integration
- Treats all discovered bugs as `learningEvents`.
- Enforces strict adherence to LAW-07 (Autonomy) by refusing to leave any system process waiting for humans if it can be programmatically wired to the `HCFullPipeline`.

// HEADY_BRAND:BEGIN
// ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces
// FILE: src/auto-loop-scheduler.js
// LAYER: core/autonomy
// PURPOSE: 34 background loops across 8 concentric rings — φ-scheduled
// HEADY_BRAND:END

const fs = require('fs');
const path = require('path');

const PHI = 1.618033988749895;
const PSI = 1 / PHI;

// ── Ring Definitions ────────────────────────────────────────────────────────
const RINGS = [
  { id: 1, name: 'Self-Healing',   swarm: 'sentinel',  loops: 5, priority: 'P0' },
  { id: 2, name: 'Intelligence',   swarm: 'diplomat',   loops: 5, priority: 'P2' },
  { id: 3, name: 'Memory',         swarm: 'oracle',     loops: 4, priority: 'P1' },
  { id: 4, name: 'Revenue',        swarm: 'diplomat',   loops: 4, priority: 'P1' },
  { id: 5, name: 'Security',       swarm: 'sentinel',   loops: 4, priority: 'P0' },
  { id: 6, name: 'Growth',         swarm: 'diplomat',   loops: 4, priority: 'P2' },
  { id: 7, name: 'Quality',        swarm: 'forge',      loops: 4, priority: 'P1' },
  { id: 8, name: 'Evolution',      swarm: 'dreamer',    loops: 4, priority: 'P1' },
];

// ── Loop Definitions (all 34) ───────────────────────────────────────────────
const LOOPS = [
  // Ring 1: Self-Healing
  { id: 'LOOP-AEGIS-PULSE',     ring: 1, interval_ms: 89000,      tool: 'aegis_heartbeat',               stages: [8],    priority: 'P0', on_fail: 'LOOP-AUTO-REPAIR' },
  { id: 'LOOP-AUTO-REPAIR',     ring: 1, interval_ms: 0,          tool: ['heady_deploy','heady_ops'],     stages: [4],    priority: 'P0', trigger: 'LOOP-AEGIS-PULSE' },
  { id: 'LOOP-CERT-WATCH',      ring: 1, interval_ms: 21600000,   tool: 'aegis_service_check',            stages: [8],    priority: 'P1' },
  { id: 'LOOP-COST-GUARD',      ring: 1, interval_ms: 14400000,   tool: ['heady_telemetry','budget-tracker'], stages: [6], priority: 'P1' },
  { id: 'LOOP-DEP-AUDIT',       ring: 1, interval_ms: 86400000,   tool: ['heady_risks','heady_coder'],    stages: [5],    priority: 'P1' },

  // Ring 2: Intelligence
  { id: 'LOOP-GH-SCOUT',        ring: 2, interval_ms: 86400000,   tool: ['heady_search','heady_oracle'],  stages: [1],    priority: 'P2' },
  { id: 'LOOP-DEEP-COMPARE',    ring: 2, interval_ms: 0,          tool: ['heady_deep_scan','heady_analyze','heady_battle'], stages: [5], priority: 'P2', trigger: 'LOOP-GH-SCOUT' },
  { id: 'LOOP-MCP-WATCH',       ring: 2, interval_ms: 86400000,   tool: ['aegis_service_check','heady_search'], stages: [1], priority: 'P2' },
  { id: 'LOOP-ARXIV-TRACK',     ring: 2, interval_ms: 86400000,   tool: 'heady_analyze',                  stages: [1],    priority: 'P2' },
  { id: 'LOOP-LLM-BENCH',       ring: 2, interval_ms: 28800000,   tool: ['heady_chat','heady_claude','heady_openai','heady_gemini','heady_groq'], stages: [6], priority: 'P1' },

  // Ring 3: Memory
  { id: 'LOOP-MEM-COMPACT',     ring: 3, interval_ms: 86400000,   tool: ['heady_memory_ops','mnemosyne_remember'], stages: [6], priority: 'P1' },
  { id: 'LOOP-CONTEXT-WARM',    ring: 3, interval_ms: 2040000,    tool: ['mnemosyne_remember','heady_soul'], stages: [1],  priority: 'P1' },
  { id: 'LOOP-RAG-REFRESH',     ring: 3, interval_ms: 86400000,   tool: ['heady_deep_scan','heady_oracle'], stages: [1,6], priority: 'P1' },
  { id: 'LOOP-CROSS-DEVICE-SYNC', ring: 3, interval_ms: 1260000,  tool: ['heady_cross_device','heady_sync'], stages: [1,8], priority: 'P1' },

  // Ring 4: Revenue
  { id: 'LOOP-STRIPE-HEALTH',   ring: 4, interval_ms: 7200000,    tool: ['heady_telemetry','budget-tracker'], stages: [8], priority: 'P1' },
  { id: 'LOOP-CHURN-PREDICT',   ring: 4, interval_ms: 86400000,   tool: ['heady_analyze','heady_oracle'], stages: [2,6],  priority: 'P2' },
  { id: 'LOOP-USAGE-METERING',  ring: 4, interval_ms: 780000,     tool: 'heady_telemetry',                stages: [1,8],  priority: 'P1' },
  { id: 'LOOP-GROWTH-SIGNAL',   ring: 4, interval_ms: 86400000,   tool: ['heady_search','heady_analyze'], stages: [1,2],  priority: 'P2' },

  // Ring 5: Security
  { id: 'LOOP-SECRET-ROTATE',   ring: 5, interval_ms: 604800000,  tool: ['heady_vault','heady_ops'],      stages: [3,8],  priority: 'P0' },
  { id: 'LOOP-THREAT-DETECT',   ring: 5, interval_ms: 300000,     tool: ['aegis_service_check','heady_risks'], stages: [8], priority: 'P0' },
  { id: 'LOOP-ZERO-TRUST-AUDIT', ring: 5, interval_ms: 86400000,  tool: ['heady_risks','heady_deep_scan'], stages: [5],   priority: 'P0' },
  { id: 'LOOP-SBOM-SCAN',       ring: 5, interval_ms: 604800000,  tool: ['heady_risks','heady_coder'],    stages: [5],    priority: 'P1' },

  // Ring 6: Growth
  { id: 'LOOP-SEO-PULSE',       ring: 6, interval_ms: 86400000,   tool: ['heady_search','heady_analyze'], stages: [1,6],  priority: 'P2' },
  { id: 'LOOP-ONBOARD-OPTIM',   ring: 6, interval_ms: 604800000,  tool: ['heady_analyze','heady_vinci'],  stages: [6],    priority: 'P2' },
  { id: 'LOOP-CONTENT-GEN',     ring: 6, interval_ms: 302400000,  tool: ['heady_chat','heady_vinci'],     stages: [2,3],  priority: 'P2' },
  { id: 'LOOP-COMMUNITY-PULSE', ring: 6, interval_ms: 86400000,   tool: ['heady_search','heady_analyze'], stages: [1],    priority: 'P2' },

  // Ring 7: Quality
  { id: 'LOOP-TEST-REGEN',      ring: 7, interval_ms: 86400000,   tool: ['heady_coder','heady_battle'],   stages: [3,5],  priority: 'P1' },
  { id: 'LOOP-PERF-BENCH',      ring: 7, interval_ms: 28800000,   tool: ['heady_telemetry','heady_analyze'], stages: [6,8], priority: 'P1' },
  { id: 'LOOP-DEAD-CODE',       ring: 7, interval_ms: 604800000,  tool: ['heady_deep_scan','heady_coder'], stages: [5,6], priority: 'P2' },
  { id: 'LOOP-API-COMPAT',      ring: 7, interval_ms: 604800000,  tool: ['heady_deep_scan','heady_risks'], stages: [5],   priority: 'P1' },

  // Ring 8: Evolution
  { id: 'LOOP-SKILL-GEN',       ring: 8, interval_ms: 604800000,  tool: ['heady_auto_flow','heady_coder','heady_battle'], stages: [2,3,4,5,6], priority: 'P1' },
  { id: 'LOOP-PIPE-OPTIM',      ring: 8, interval_ms: 604800000,  tool: ['heady_vinci','heady_analyze','heady_soul'], stages: [6], priority: 'P1' },
  { id: 'LOOP-ARCH-REVIEW',     ring: 8, interval_ms: 2592000000, tool: ['heady_deep_scan','heady_analyze','heady_vinci'], stages: [5,6], priority: 'P1' },
  { id: 'LOOP-RUNTIME-DELTA',   ring: 8, interval_ms: 604800000,  tool: 'all',                            stages: 'all',  priority: 'P1' },
];

/**
 * AutoLoopScheduler — manages 34 background loops across 8 concentric rings.
 * Each loop is a self-contained microservice that runs on a φ-scaled cadence.
 * Feeds results into HCFullPipeline stages.
 */
class AutoLoopScheduler {
  constructor(options = {}) {
    this.loops = new Map();
    this.intervals = new Map();
    this.results = new Map();
    this.running = false;
    this.startedAt = null;
    this.cycleCount = 0;
    this.pipeline = options.pipeline || null;
    this.toolRouter = options.toolRouter || null;

    // Register all 34 loops
    for (const loop of LOOPS) {
      this.loops.set(loop.id, {
        ...loop,
        lastRun: null,
        lastResult: null,
        runCount: 0,
        failures: 0,
        status: 'idle',
      });
    }
  }

  /**
   * Start all scheduled loops.
   * Triggered loops (interval_ms=0) are not scheduled — they fire from on_fail chains.
   */
  start() {
    if (this.running) return;
    this.running = true;
    this.startedAt = Date.now();

    console.log(`  ∞ AutoLoopScheduler: Starting ${LOOPS.length} loops across ${RINGS.length} rings`);

    for (const [id, loop] of this.loops) {
      if (loop.interval_ms === 0) {
        // Triggered loop — not scheduled, activated by on_fail chains
        loop.status = 'triggered-only';
        continue;
      }

      // φ-jitter: spread out initial starts to avoid thundering herd
      const jitter = Math.round(loop.ring * PHI * 1000);

      setTimeout(() => {
        this._runLoop(id);
        const handle = setInterval(() => this._runLoop(id), loop.interval_ms);
        this.intervals.set(id, handle);
      }, jitter);

      loop.status = 'scheduled';
    }

    return this.getStatus();
  }

  /**
   * Run a single loop iteration.
   */
  async _runLoop(id) {
    const loop = this.loops.get(id);
    if (!loop) return;

    loop.status = 'running';
    loop.lastRun = Date.now();
    loop.runCount++;

    try {
      const result = await this._executeLoop(loop);
      loop.lastResult = result;
      loop.status = 'completed';

      // Check if we need to trigger on_fail chain
      if (result && result.score !== undefined && result.score < PSI && loop.on_fail) {
        const triggeredLoop = this.loops.get(loop.on_fail);
        if (triggeredLoop) {
          console.log(`  ⚠ ${id}: score ${result.score} < ${PSI}, triggering ${loop.on_fail}`);
          await this._runLoop(loop.on_fail);
        }
      }

      // Feed result into pipeline
      if (this.pipeline && result) {
        this.results.set(id, {
          loopId: id,
          ring: loop.ring,
          result,
          ts: Date.now(),
          stages: loop.stages,
        });
      }
    } catch (err) {
      loop.failures++;
      loop.status = 'failed';
      loop.lastResult = { error: err.message };
      console.warn(`  ⚠ ${id}: ${err.message}`);
    }

    this.cycleCount++;
  }

  /**
   * Execute a loop's tool(s).
   * Override this method to integrate with real tool router.
   */
  async _executeLoop(loop) {
    // Default implementation: check if tool handler exists
    const tools = Array.isArray(loop.tool) ? loop.tool : [loop.tool];
    const results = {};

    for (const tool of tools) {
      if (this.toolRouter && typeof this.toolRouter[tool] === 'function') {
        results[tool] = await this.toolRouter[tool]();
      } else {
        // Stub: tool not yet connected
        results[tool] = { status: 'stub', message: `Tool ${tool} not yet connected` };
      }
    }

    return {
      loopId: loop.id,
      ring: loop.ring,
      tools: Object.keys(results),
      results,
      score: 1.0, // Default healthy — real score computed by tool
      ts: Date.now(),
    };
  }

  /**
   * Stop all loops gracefully.
   */
  stop() {
    this.running = false;
    for (const [id, handle] of this.intervals) {
      clearInterval(handle);
    }
    this.intervals.clear();
    console.log('  ∞ AutoLoopScheduler: All loops stopped');
  }

  /**
   * Get scheduler status — used by /api/auto-loops/status endpoint.
   */
  getStatus() {
    const ringStats = {};
    for (const ring of RINGS) {
      const ringLoops = [...this.loops.values()].filter(l => l.ring === ring.id);
      ringStats[`ring_${ring.id}_${ring.name.toLowerCase().replace(/[- ]/g, '_')}`] = {
        name: ring.name,
        swarm: ring.swarm,
        loops: ringLoops.length,
        running: ringLoops.filter(l => l.status === 'scheduled' || l.status === 'running').length,
        failed: ringLoops.filter(l => l.status === 'failed').length,
        totalRuns: ringLoops.reduce((s, l) => s + l.runCount, 0),
      };
    }

    return {
      running: this.running,
      startedAt: this.startedAt,
      totalLoops: LOOPS.length,
      totalRings: RINGS.length,
      cycleCount: this.cycleCount,
      ringStats,
      loops: [...this.loops.values()].map(l => ({
        id: l.id, ring: l.ring, status: l.status,
        runCount: l.runCount, failures: l.failures,
        lastRun: l.lastRun, priority: l.priority,
      })),
    };
  }

  /**
   * Get results for a specific pipeline stage.
   * Used by HCFullPipeline to pull data from auto-loops.
   */
  getResultsForStage(stageNumber) {
    const stageResults = [];
    for (const [id, result] of this.results) {
      const loop = this.loops.get(id);
      if (loop && (loop.stages === 'all' || (Array.isArray(loop.stages) && loop.stages.includes(stageNumber)))) {
        stageResults.push(result);
      }
    }
    return stageResults;
  }
}

module.exports = { AutoLoopScheduler, RINGS, LOOPS };

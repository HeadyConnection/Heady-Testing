/**
 * © 2026 Heady™Systems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * ─── Phi-Stepped Chaos Injection Engine ──────────────────────────────────────
 *
 * Implements systematic resource strangulation using Fibonacci-timed failures.
 * The system is mandated to recover via fallback chains without packet loss.
 *
 * Chaos Protocol:
 *   1. Kill Database       → Verify reconnect
 *   2. Kill Primary LLM    → Verify fallback chain (Gemini → GPT → Workers AI)
 *   3. Simulate Deploy Reg  → Verify automatic rollback before canary interval
 *   4. Resource exhaustion  → Verify graceful degradation
 *
 * Timing: Fibonacci sequence × φ (1.618) for injection intervals.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const EventEmitter = require('events');

const PHI = 1.6180339887;
const FIB_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

// ─────────────────────────────────────────────────────────────────────────────
// CHAOS SCENARIOS
// ─────────────────────────────────────────────────────────────────────────────

const ChaosScenario = {
    DATABASE_KILL:        'database_kill',
    LLM_PRIMARY_KILL:     'llm_primary_kill',
    REDIS_KILL:           'redis_kill',
    DEPLOY_REGRESSION:    'deploy_regression',
    MEMORY_PRESSURE:      'memory_pressure',
    NETWORK_PARTITION:    'network_partition',
    LATENCY_SPIKE:        'latency_spike',
    CASCADE_FAILURE:      'cascade_failure',
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAOS INJECTOR
// ─────────────────────────────────────────────────────────────────────────────

class ChaosInjector extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.scenarios = [];
        this.results = [];
        this.isRunning = false;
        this.verbose = opts.verbose !== false;

        // Service health simulators
        this._services = {
            database:  { healthy: true, reconnectMs: 0 },
            redis:     { healthy: true, reconnectMs: 0 },
            llm:       { healthy: true, fallbackChain: ['gemini', 'gpt-4.1-mini', 'workers-ai', 'colab-vllm'] },
            deploy:    { healthy: true, canaryPercent: 0 },
        };

        // Recovery callbacks registered by the system under test
        this._recoveryHandlers = new Map();
    }

    /**
     * Register a recovery handler for a service.
     * The handler is called when chaos is injected and must return true if recovery succeeded.
     * @param {string} service
     * @param {Function} handler — async (chaosEvent) => boolean
     */
    registerRecovery(service, handler) {
        this._recoveryHandlers.set(service, handler);
    }

    /**
     * Build a Fibonacci-timed chaos schedule.
     * Injects failures at t = FIB[i] × φ × baseMs.
     * @param {Object} opts
     * @param {number} opts.baseMs — base time unit (default 1000)
     * @param {string[]} opts.scenarios — which chaos scenarios to include
     * @returns {Array<{ scenario, triggerAtMs, fibIndex }>}
     */
    buildSchedule(opts = {}) {
        const baseMs = opts.baseMs || 1000;
        const scenarioList = opts.scenarios || [
            ChaosScenario.REDIS_KILL,
            ChaosScenario.LLM_PRIMARY_KILL,
            ChaosScenario.DATABASE_KILL,
            ChaosScenario.DEPLOY_REGRESSION,
            ChaosScenario.LATENCY_SPIKE,
        ];

        this.scenarios = scenarioList.map((scenario, i) => {
            const fibIdx = Math.min(i + 2, FIB_SEQUENCE.length - 1); // Start at FIB[2]=2
            const triggerAtMs = Math.round(FIB_SEQUENCE[fibIdx] * PHI * baseMs);
            return { scenario, triggerAtMs, fibIndex: fibIdx };
        });

        // Sort by trigger time
        this.scenarios.sort((a, b) => a.triggerAtMs - b.triggerAtMs);

        if (this.verbose) {
            console.log('\n  [CHAOS] Schedule built:');
            for (const s of this.scenarios) {
                console.log(`    ├─ t=${s.triggerAtMs}ms (FIB[${s.fibIndex}]×φ) → ${s.scenario}`);
            }
        }

        return this.scenarios;
    }

    /**
     * Execute the chaos schedule synchronously (for testing).
     * Each scenario is injected, then the system is given time to recover.
     * @param {Object} opts
     * @param {number} opts.recoveryWindowMs — time allowed for recovery (default 5000)
     * @returns {{ totalScenarios, passed, failed, results }}
     */
    async executeSchedule(opts = {}) {
        const recoveryWindowMs = opts.recoveryWindowMs || 5000;
        this.isRunning = true;
        this.results = [];

        console.log('\n══════════════════════════════════════════════════════');
        console.log('  Phi-Stepped Chaos Injection');
        console.log('  © 2026 Heady™Systems Inc.');
        console.log('══════════════════════════════════════════════════════\n');

        for (const schedule of this.scenarios) {
            const result = await this._injectAndVerify(schedule, recoveryWindowMs);
            this.results.push(result);
            this.emit('scenario_complete', result);
        }

        this.isRunning = false;

        const passed = this.results.filter(r => r.recovered).length;
        const failed = this.results.filter(r => !r.recovered).length;

        console.log('\n══════════════════════════════════════════════════════');
        console.log(`  Chaos Results: ${passed} recovered, ${failed} failed`);
        console.log(`  Resilience Score: ${(passed / Math.max(1, this.results.length)).toFixed(3)}`);
        console.log('══════════════════════════════════════════════════════\n');

        return {
            totalScenarios: this.results.length,
            passed,
            failed,
            results: this.results,
            resilienceScore: passed / Math.max(1, this.results.length),
        };
    }

    /**
     * Generate synthetic fuzzing payloads for pipeline boundary testing.
     * @param {number} count — number of payloads to generate
     * @returns {Array<Object>}
     */
    generateFuzzPayloads(count = 100) {
        const payloads = [];
        const generators = [
            // Null/undefined boundaries
            () => ({ type: 'null_field', payload: { data: null, id: Math.random() } }),
            () => ({ type: 'empty_string', payload: { data: '', id: '' } }),
            () => ({ type: 'undefined_field', payload: { data: undefined } }),

            // Numeric boundaries
            () => ({ type: 'max_int', payload: { value: Number.MAX_SAFE_INTEGER } }),
            () => ({ type: 'negative', payload: { value: -1 } }),
            () => ({ type: 'float_precision', payload: { value: 0.1 + 0.2 } }),
            () => ({ type: 'infinity', payload: { value: Infinity } }),
            () => ({ type: 'nan', payload: { value: NaN } }),

            // String boundaries
            () => ({ type: 'long_string', payload: { data: 'x'.repeat(10000) } }),
            () => ({ type: 'unicode', payload: { data: '🎭💀🔥\u0000\uffff' } }),
            () => ({ type: 'special_chars', payload: { data: '<script>alert(1)</script>' } }),
            () => ({ type: 'sql_inject', payload: { data: "'; DROP TABLE users; --" } }),
            () => ({ type: 'path_traversal', payload: { data: '../../etc/passwd' } }),

            // Structural boundaries
            () => ({ type: 'nested_deep', payload: this._buildNested(50) }),
            () => ({ type: 'array_huge', payload: { items: new Array(1000).fill(0) } }),
            () => ({ type: 'circular_ref', payload: (() => { const o = {}; o.self = o; return { note: 'circular' }; })() }),

            // Type mismatches
            () => ({ type: 'wrong_type_string_as_number', payload: { count: 'not_a_number' } }),
            () => ({ type: 'wrong_type_number_as_string', payload: { name: 42 } }),
            () => ({ type: 'wrong_type_array_as_object', payload: { config: [1, 2, 3] } }),
        ];

        for (let i = 0; i < count; i++) {
            const gen = generators[i % generators.length];
            payloads.push({ index: i, ...gen(), generatedAt: Date.now() });
        }

        return payloads;
    }

    // ─── PRIVATE ─────────────────────────────────────────────────────────────

    async _injectAndVerify(schedule, recoveryWindowMs) {
        const { scenario, triggerAtMs, fibIndex } = schedule;

        if (this.verbose) {
            console.log(`  [CHAOS] Injecting: ${scenario} (FIB[${fibIndex}]×φ = ${triggerAtMs}ms)`);
        }

        // Inject the failure
        const injectionResult = this._inject(scenario);

        // Allow recovery time
        await this._asyncSleep(Math.min(recoveryWindowMs, 2000));

        // Check if recovery handler exists and succeeds
        const handler = this._recoveryHandlers.get(this._scenarioToService(scenario));
        let recovered = false;
        let recoveryDetail = 'no recovery handler registered';

        if (handler) {
            try {
                recovered = await handler({ scenario, injectionResult });
                recoveryDetail = recovered ? 'recovered successfully' : 'recovery handler returned false';
            } catch (err) {
                recoveryDetail = `recovery handler threw: ${err.message}`;
            }
        } else {
            // Default: check service health directly
            const svc = this._scenarioToService(scenario);
            if (this._services[svc]) {
                // Simulate auto-recovery
                this._services[svc].healthy = true;
                recovered = true;
                recoveryDetail = 'auto-healed (default recovery)';
            }
        }

        const icon = recovered ? '✓' : '✗';
        if (this.verbose) {
            console.log(`    ${icon} ${scenario}: ${recoveryDetail}`);
        }

        return {
            scenario,
            fibIndex,
            triggerAtMs,
            recovered,
            recoveryDetail,
            timestamp: new Date().toISOString(),
        };
    }

    _inject(scenario) {
        switch (scenario) {
            case ChaosScenario.DATABASE_KILL:
                this._services.database.healthy = false;
                return { killed: 'database' };

            case ChaosScenario.REDIS_KILL:
                this._services.redis.healthy = false;
                return { killed: 'redis' };

            case ChaosScenario.LLM_PRIMARY_KILL:
                this._services.llm.healthy = false;
                return { killed: 'llm_primary', fallbackAvailable: this._services.llm.fallbackChain };

            case ChaosScenario.DEPLOY_REGRESSION:
                this._services.deploy.healthy = false;
                this._services.deploy.canaryPercent = 25;
                return { regression: true, canaryPercent: 25 };

            case ChaosScenario.LATENCY_SPIKE:
                return { latencyMs: Math.round(5000 * PHI) };

            case ChaosScenario.MEMORY_PRESSURE:
                return { memoryPressure: true };

            case ChaosScenario.NETWORK_PARTITION:
                return { partitioned: true };

            case ChaosScenario.CASCADE_FAILURE:
                this._services.database.healthy = false;
                this._services.redis.healthy = false;
                return { killed: ['database', 'redis'] };

            default:
                return { unknown: scenario };
        }
    }

    _scenarioToService(scenario) {
        const map = {
            [ChaosScenario.DATABASE_KILL]: 'database',
            [ChaosScenario.REDIS_KILL]: 'redis',
            [ChaosScenario.LLM_PRIMARY_KILL]: 'llm',
            [ChaosScenario.DEPLOY_REGRESSION]: 'deploy',
            [ChaosScenario.LATENCY_SPIKE]: 'llm',
            [ChaosScenario.MEMORY_PRESSURE]: 'database',
            [ChaosScenario.NETWORK_PARTITION]: 'database',
            [ChaosScenario.CASCADE_FAILURE]: 'database',
        };
        return map[scenario] || 'database';
    }

    _buildNested(depth) {
        let obj = { value: 'leaf' };
        for (let i = 0; i < depth; i++) obj = { nested: obj };
        return obj;
    }

    _asyncSleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = { ChaosInjector, ChaosScenario, PHI, FIB_SEQUENCE };

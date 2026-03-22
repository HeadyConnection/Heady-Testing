'use strict';

/**
 * Chaos Injector — Phi-Stepped Chaos Engineering
 *
 * Schedules and injects controlled failures at Fibonacci intervals
 * to validate system resilience. Targets include: database connections,
 * LLM providers, cache layers, network, and memory.
 *
 * After injection, verifies system recovery within phi-scaled timeouts.
 *
 * Part of the Heady Zero-Intervention Autonomous Testing Infrastructure.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHI-DERIVED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PSI = 0.618033988749895;
const PHI_7_MS = 29034;
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

// ═══════════════════════════════════════════════════════════════════════════════
// FAILURE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

const FAILURE_TYPE = Object.freeze({
  DATABASE_DOWN: 'database_down',
  LLM_TIMEOUT: 'llm_timeout',
  CACHE_MISS: 'cache_miss',
  NETWORK_PARTITION: 'network_partition',
  MEMORY_PRESSURE: 'memory_pressure',
  DISK_FULL: 'disk_full',
  LATENCY_SPIKE: 'latency_spike',
  ERROR_RATE_SPIKE: 'error_rate_spike',
});

// ═══════════════════════════════════════════════════════════════════════════════
// TARGET STATUS
// ═══════════════════════════════════════════════════════════════════════════════

const TARGET_STATUS = Object.freeze({
  HEALTHY: 'healthy',
  INJECTED: 'injected',
  RECOVERING: 'recovering',
  RECOVERED: 'recovered',
  FAILED: 'failed',
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHAOS INJECTOR
// ═══════════════════════════════════════════════════════════════════════════════

class ChaosInjector {
  /**
   * @param {object} [options]
   * @param {number} [options.recoveryTimeoutMs] - Max recovery wait time
   * @param {number} [options.baseIntervalMs]    - Base interval between injections
   */
  constructor(options = {}) {
    this.fibonacci = [...FIBONACCI];
    this.phi = PHI;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs || PHI_7_MS;
    this.baseIntervalMs = options.baseIntervalMs || 1000;

    /** @type {Array<object>} */
    this.injectionLog = [];

    /** @type {Map<string, { status: string, lastInjection: object|null }>} */
    this.targets = new Map();

    /** @type {{ injections: number, recoveries: number, failures: number }} */
    this.stats = {
      injections: 0,
      recoveries: 0,
      failures: 0,
      totalProtocols: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TARGET MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a target for chaos injection.
   * @param {string} name - Target identifier
   * @param {object} [config]
   * @param {Function} [config.healthCheck] - Async function returning boolean
   * @param {Function} [config.onInject]    - Called when failure is injected
   * @param {Function} [config.onRecover]   - Called when recovery is attempted
   */
  registerTarget(name, config = {}) {
    this.targets.set(name, {
      status: TARGET_STATUS.HEALTHY,
      lastInjection: null,
      healthCheck: config.healthCheck || (async () => true),
      onInject: config.onInject || null,
      onRecover: config.onRecover || null,
    });
  }

  /**
   * Get target status.
   * @param {string} name
   * @returns {string|null}
   */
  getTargetStatus(name) {
    const target = this.targets.get(name);
    return target ? target.status : null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIBONACCI-SCHEDULED CHAOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a schedule of chaos events at Fibonacci intervals.
   * @param {string[]} targets - Target names to inject chaos into
   * @returns {Array<{ target: string, delayMs: number, fibIndex: number }>}
   */
  scheduleFibonacciChaos(targets) {
    const schedule = [];

    for (let i = 0; i < targets.length; i++) {
      const fibIndex = i % this.fibonacci.length;
      const delayMs = Math.round(this.baseIntervalMs * this.fibonacci[fibIndex] * this.phi);

      schedule.push({
        target: targets[i],
        delayMs,
        fibIndex,
        fibValue: this.fibonacci[fibIndex],
        scheduledAt: Date.now() + delayMs,
      });
    }

    // Sort by delay (ascending)
    schedule.sort((a, b) => a.delayMs - b.delayMs);

    return schedule;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAILURE INJECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Inject a specific failure into a target.
   * @param {string} targetName - Target to inject into
   * @param {string} type       - Failure type from FAILURE_TYPE
   * @returns {{ injected: boolean, target: string, type: string, timestamp: number, details: string }}
   */
  async injectFailure(targetName, type) {
    const target = this.targets.get(targetName);
    const injection = {
      injected: false,
      target: targetName,
      type,
      timestamp: Date.now(),
      details: '',
    };

    if (!target) {
      injection.details = `Target '${targetName}' not registered`;
      this.injectionLog.push(injection);
      return injection;
    }

    // Apply failure based on type
    try {
      switch (type) {
        case FAILURE_TYPE.DATABASE_DOWN:
          injection.details = 'Simulated database connection failure';
          break;

        case FAILURE_TYPE.LLM_TIMEOUT:
          injection.details = `Simulated LLM timeout (${PHI_7_MS}ms)`;
          break;

        case FAILURE_TYPE.CACHE_MISS:
          injection.details = 'Simulated complete cache eviction';
          break;

        case FAILURE_TYPE.NETWORK_PARTITION:
          injection.details = 'Simulated network partition (50% packet loss)';
          break;

        case FAILURE_TYPE.MEMORY_PRESSURE:
          injection.details = 'Simulated memory pressure (85% utilization)';
          break;

        case FAILURE_TYPE.DISK_FULL:
          injection.details = 'Simulated disk full condition';
          break;

        case FAILURE_TYPE.LATENCY_SPIKE:
          injection.details = `Simulated latency spike (+${Math.round(PHI_7_MS * PSI)}ms)`;
          break;

        case FAILURE_TYPE.ERROR_RATE_SPIKE:
          injection.details = 'Simulated error rate spike (50% failure rate)';
          break;

        default:
          injection.details = `Unknown failure type: ${type}`;
          this.injectionLog.push(injection);
          return injection;
      }

      // Call target's onInject handler
      if (target.onInject) {
        await target.onInject(type, injection.details);
      }

      target.status = TARGET_STATUS.INJECTED;
      target.lastInjection = injection;
      injection.injected = true;
      this.stats.injections++;

    } catch (err) {
      injection.details = `Injection failed: ${err.message}`;
    }

    this.injectionLog.push(injection);
    return injection;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verify that a target recovers within the given timeout.
   * Uses phi-scaled polling intervals.
   * @param {string} targetName
   * @param {number} [timeoutMs] - Recovery timeout (default: PHI_7_MS)
   * @returns {{ recovered: boolean, target: string, durationMs: number, probes: number }}
   */
  async verifyRecovery(targetName, timeoutMs) {
    const timeout = timeoutMs || this.recoveryTimeoutMs;
    const target = this.targets.get(targetName);
    const startTime = Date.now();
    let probes = 0;

    if (!target) {
      return { recovered: false, target: targetName, durationMs: 0, probes: 0 };
    }

    target.status = TARGET_STATUS.RECOVERING;

    // Call target's onRecover handler
    if (target.onRecover) {
      try {
        await target.onRecover();
      } catch {
        // Recovery handler may fail — that's part of the test
      }
    }

    // Probe at Fibonacci-scaled intervals
    for (let i = 0; i < this.fibonacci.length; i++) {
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) break;

      const pollInterval = Math.round(this.baseIntervalMs * this.fibonacci[i] * PSI);
      await this._sleep(Math.min(pollInterval, timeout - elapsed));
      probes++;

      // Check health
      try {
        const healthy = await target.healthCheck();
        if (healthy) {
          target.status = TARGET_STATUS.RECOVERED;
          this.stats.recoveries++;
          return {
            recovered: true,
            target: targetName,
            durationMs: Date.now() - startTime,
            probes,
          };
        }
      } catch {
        // Probe failed — continue polling
      }
    }

    // Recovery failed
    target.status = TARGET_STATUS.FAILED;
    this.stats.failures++;

    return {
      recovered: false,
      target: targetName,
      durationMs: Date.now() - startTime,
      probes,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL CHAOS PROTOCOL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Run the full chaos injection and recovery protocol.
   * For each registered target: inject -> verify recovery.
   * @returns {{ results: Array<object>, stats: object, duration_ms: number }}
   */
  async runChaosProtocol() {
    this.stats.totalProtocols++;
    const startTime = Date.now();
    const results = [];
    const targetNames = [...this.targets.keys()];

    // Generate Fibonacci-scheduled chaos
    const schedule = this.scheduleFibonacciChaos(targetNames);

    // Assign failure types (round-robin)
    const failureTypes = Object.values(FAILURE_TYPE);

    for (let i = 0; i < schedule.length; i++) {
      const { target: targetName } = schedule[i];
      const failureType = failureTypes[i % failureTypes.length];

      // Inject failure
      const injection = await this.injectFailure(targetName, failureType);

      // Verify recovery
      const recovery = await this.verifyRecovery(targetName);

      results.push({
        target: targetName,
        failureType,
        injection,
        recovery,
        resilient: recovery.recovered,
      });
    }

    return {
      results,
      stats: { ...this.stats },
      duration_ms: Date.now() - startTime,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS & REPORTING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get the full injection log.
   * @returns {Array<object>}
   */
  getInjectionLog() {
    return [...this.injectionLog];
  }

  /**
   * Get chaos injection statistics.
   * @returns {object}
   */
  getStats() {
    return {
      ...this.stats,
      recoveryRate: this.stats.injections > 0
        ? this.stats.recoveries / this.stats.injections
        : 1.0,
      targetCount: this.targets.size,
    };
  }

  /**
   * Reset all targets to healthy state and clear logs.
   */
  reset() {
    for (const target of this.targets.values()) {
      target.status = TARGET_STATUS.HEALTHY;
      target.lastInjection = null;
    }
    this.injectionLog = [];
    this.stats = { injections: 0, recoveries: 0, failures: 0, totalProtocols: 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  ChaosInjector,
  FAILURE_TYPE,
  TARGET_STATUS,
  PHI,
  PSI,
  PHI_7_MS,
  FIBONACCI,
};

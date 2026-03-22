import { describe, test, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Chaos Injector Tests — Phi-Stepped Chaos Engineering
// ═══════════════════════════════════════════════════════════════════════════════

const {
  ChaosInjector,
  FAILURE_TYPE,
  TARGET_STATUS,
  PHI,
  PSI,
  PHI_7_MS,
  FIBONACCI,
} = require('../../src/testing/chaos-injector.js');

describe('ChaosInjector', () => {
  let chaos;

  beforeEach(() => {
    chaos = new ChaosInjector({
      recoveryTimeoutMs: 500, // Fast for tests
      baseIntervalMs: 10,     // Fast for tests
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════════════════════════

  test('initializes with correct phi-derived constants', () => {
    expect(chaos.phi).toBe(PHI);
    expect(chaos.fibonacci).toEqual(FIBONACCI);
    expect(chaos.injectionLog).toHaveLength(0);
    expect(chaos.targets).toBeInstanceOf(Map);
    expect(chaos.stats.injections).toBe(0);
    expect(chaos.stats.recoveries).toBe(0);
    expect(chaos.stats.failures).toBe(0);
  });

  test('uses default recovery timeout when not specified', () => {
    const defaultChaos = new ChaosInjector();
    expect(defaultChaos.recoveryTimeoutMs).toBe(PHI_7_MS);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Target Management
  // ═══════════════════════════════════════════════════════════════════════════

  test('registerTarget adds target with healthy status', () => {
    chaos.registerTarget('database');
    expect(chaos.targets.has('database')).toBe(true);
    expect(chaos.getTargetStatus('database')).toBe(TARGET_STATUS.HEALTHY);
  });

  test('registerTarget accepts custom health check', () => {
    const healthCheck = vi.fn().mockResolvedValue(true);
    chaos.registerTarget('cache', { healthCheck });
    expect(chaos.targets.get('cache').healthCheck).toBe(healthCheck);
  });

  test('getTargetStatus returns null for unregistered target', () => {
    expect(chaos.getTargetStatus('nonexistent')).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Fibonacci Scheduling
  // ═══════════════════════════════════════════════════════════════════════════

  test('scheduleFibonacciChaos generates correct schedule', () => {
    const targets = ['db', 'cache', 'api'];
    const schedule = chaos.scheduleFibonacciChaos(targets);

    expect(schedule).toHaveLength(3);

    // Check that each entry has the expected structure
    for (const entry of schedule) {
      expect(entry).toHaveProperty('target');
      expect(entry).toHaveProperty('delayMs');
      expect(entry).toHaveProperty('fibIndex');
      expect(entry).toHaveProperty('fibValue');
      expect(entry).toHaveProperty('scheduledAt');
      expect(entry.delayMs).toBeGreaterThan(0);
    }
  });

  test('scheduleFibonacciChaos uses phi-scaled fibonacci intervals', () => {
    const targets = ['t0', 't1', 't2', 't3', 't4'];
    const schedule = chaos.scheduleFibonacciChaos(targets);

    // Verify delays are fibonacci * phi * base
    for (let i = 0; i < targets.length; i++) {
      const entry = schedule.find(s => s.target === targets[i]);
      const expectedDelay = Math.round(chaos.baseIntervalMs * FIBONACCI[i] * PHI);
      expect(entry.delayMs).toBe(expectedDelay);
    }
  });

  test('scheduleFibonacciChaos returns schedule sorted by delay', () => {
    const targets = ['a', 'b', 'c', 'd', 'e'];
    const schedule = chaos.scheduleFibonacciChaos(targets);

    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].delayMs).toBeGreaterThanOrEqual(schedule[i - 1].delayMs);
    }
  });

  test('scheduleFibonacciChaos handles empty targets', () => {
    const schedule = chaos.scheduleFibonacciChaos([]);
    expect(schedule).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Failure Injection
  // ═══════════════════════════════════════════════════════════════════════════

  test('injectFailure injects database_down failure', async () => {
    chaos.registerTarget('database');
    const result = await chaos.injectFailure('database', FAILURE_TYPE.DATABASE_DOWN);

    expect(result.injected).toBe(true);
    expect(result.target).toBe('database');
    expect(result.type).toBe(FAILURE_TYPE.DATABASE_DOWN);
    expect(result.details).toContain('database');
    expect(chaos.getTargetStatus('database')).toBe(TARGET_STATUS.INJECTED);
  });

  test('injectFailure injects llm_timeout failure', async () => {
    chaos.registerTarget('llm');
    const result = await chaos.injectFailure('llm', FAILURE_TYPE.LLM_TIMEOUT);

    expect(result.injected).toBe(true);
    expect(result.details).toContain('timeout');
  });

  test('injectFailure injects latency_spike failure', async () => {
    chaos.registerTarget('api');
    const result = await chaos.injectFailure('api', FAILURE_TYPE.LATENCY_SPIKE);

    expect(result.injected).toBe(true);
    expect(result.details).toContain('latency');
  });

  test('injectFailure fails for unregistered target', async () => {
    const result = await chaos.injectFailure('nonexistent', FAILURE_TYPE.DATABASE_DOWN);

    expect(result.injected).toBe(false);
    expect(result.details).toContain('not registered');
  });

  test('injectFailure handles unknown failure type', async () => {
    chaos.registerTarget('target');
    const result = await chaos.injectFailure('target', 'totally_unknown_type');

    expect(result.injected).toBe(false);
    expect(result.details).toContain('Unknown');
  });

  test('injectFailure calls onInject handler', async () => {
    const onInject = vi.fn();
    chaos.registerTarget('db', { onInject });

    await chaos.injectFailure('db', FAILURE_TYPE.DATABASE_DOWN);

    expect(onInject).toHaveBeenCalledWith(
      FAILURE_TYPE.DATABASE_DOWN,
      expect.any(String)
    );
  });

  test('injectFailure increments injection stats', async () => {
    chaos.registerTarget('db');
    chaos.registerTarget('cache');

    await chaos.injectFailure('db', FAILURE_TYPE.DATABASE_DOWN);
    await chaos.injectFailure('cache', FAILURE_TYPE.CACHE_MISS);

    expect(chaos.stats.injections).toBe(2);
  });

  test('injectFailure logs all injections', async () => {
    chaos.registerTarget('db');
    await chaos.injectFailure('db', FAILURE_TYPE.DATABASE_DOWN);
    await chaos.injectFailure('db', FAILURE_TYPE.LATENCY_SPIKE);

    expect(chaos.getInjectionLog()).toHaveLength(2);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // All Failure Types
  // ═══════════════════════════════════════════════════════════════════════════

  test('all failure types can be injected', async () => {
    chaos.registerTarget('universal');

    for (const type of Object.values(FAILURE_TYPE)) {
      // Reset target status
      chaos.targets.get('universal').status = TARGET_STATUS.HEALTHY;
      const result = await chaos.injectFailure('universal', type);
      expect(result.injected).toBe(true);
      expect(result.type).toBe(type);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Recovery Verification
  // ═══════════════════════════════════════════════════════════════════════════

  test('verifyRecovery succeeds when health check passes', async () => {
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockResolvedValue(true),
    });
    chaos.targets.get('db').status = TARGET_STATUS.INJECTED;

    const result = await chaos.verifyRecovery('db', 500);

    expect(result.recovered).toBe(true);
    expect(result.target).toBe('db');
    expect(result.probes).toBeGreaterThan(0);
    expect(chaos.getTargetStatus('db')).toBe(TARGET_STATUS.RECOVERED);
  });

  test('verifyRecovery fails when health check never passes', async () => {
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockResolvedValue(false),
    });
    chaos.targets.get('db').status = TARGET_STATUS.INJECTED;

    const result = await chaos.verifyRecovery('db', 100);

    expect(result.recovered).toBe(false);
    expect(result.target).toBe('db');
    expect(chaos.getTargetStatus('db')).toBe(TARGET_STATUS.FAILED);
  }, 10000);

  test('verifyRecovery fails for unregistered target', async () => {
    const result = await chaos.verifyRecovery('nonexistent', 100);
    expect(result.recovered).toBe(false);
    expect(result.probes).toBe(0);
  });

  test('verifyRecovery calls onRecover handler', async () => {
    const onRecover = vi.fn();
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockResolvedValue(true),
      onRecover,
    });

    await chaos.verifyRecovery('db', 500);
    expect(onRecover).toHaveBeenCalled();
  });

  test('verifyRecovery handles health check exceptions', async () => {
    let callCount = 0;
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) throw new Error('not ready');
        return true;
      }),
    });

    const result = await chaos.verifyRecovery('db', 2000);
    expect(result.recovered).toBe(true);
  }, 10000);

  test('verifyRecovery tracks recovery stats', async () => {
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockResolvedValue(true),
    });

    await chaos.verifyRecovery('db', 500);
    expect(chaos.stats.recoveries).toBe(1);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Full Chaos Protocol
  // ═══════════════════════════════════════════════════════════════════════════

  test('runChaosProtocol runs injection and recovery for all targets', async () => {
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockResolvedValue(true),
    });
    chaos.registerTarget('cache', {
      healthCheck: vi.fn().mockResolvedValue(true),
    });

    const report = await chaos.runChaosProtocol();

    expect(report.results).toHaveLength(2);
    expect(report.stats.injections).toBe(2);
    expect(report.stats.totalProtocols).toBe(1);
    expect(report.duration_ms).toBeGreaterThanOrEqual(0);

    for (const result of report.results) {
      expect(result).toHaveProperty('target');
      expect(result).toHaveProperty('failureType');
      expect(result).toHaveProperty('injection');
      expect(result).toHaveProperty('recovery');
      expect(result).toHaveProperty('resilient');
    }
  }, 15000);

  test('runChaosProtocol handles mixed recovery results', async () => {
    chaos.registerTarget('healthy-service', {
      healthCheck: vi.fn().mockResolvedValue(true),
    });
    chaos.registerTarget('broken-service', {
      healthCheck: vi.fn().mockResolvedValue(false),
    });

    const report = await chaos.runChaosProtocol();

    const healthyResult = report.results.find(r => r.target === 'healthy-service');
    const brokenResult = report.results.find(r => r.target === 'broken-service');

    expect(healthyResult.resilient).toBe(true);
    expect(brokenResult.resilient).toBe(false);
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════════
  // Reset
  // ═══════════════════════════════════════════════════════════════════════════

  test('reset clears all state', async () => {
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockResolvedValue(true),
    });
    await chaos.injectFailure('db', FAILURE_TYPE.DATABASE_DOWN);

    expect(chaos.stats.injections).toBe(1);
    expect(chaos.getInjectionLog()).toHaveLength(1);

    chaos.reset();

    expect(chaos.stats.injections).toBe(0);
    expect(chaos.stats.recoveries).toBe(0);
    expect(chaos.stats.failures).toBe(0);
    expect(chaos.getInjectionLog()).toHaveLength(0);
    expect(chaos.getTargetStatus('db')).toBe(TARGET_STATUS.HEALTHY);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════════════════════

  test('getStats returns complete statistics', async () => {
    chaos.registerTarget('db', {
      healthCheck: vi.fn().mockResolvedValue(true),
    });
    await chaos.injectFailure('db', FAILURE_TYPE.DATABASE_DOWN);
    await chaos.verifyRecovery('db', 500);

    const stats = chaos.getStats();
    expect(stats.injections).toBe(1);
    expect(stats.recoveries).toBe(1);
    expect(stats.recoveryRate).toBe(1.0);
    expect(stats.targetCount).toBe(1);
  });

  test('getStats calculates recovery rate correctly', async () => {
    chaos.registerTarget('good', { healthCheck: vi.fn().mockResolvedValue(true) });
    chaos.registerTarget('bad', { healthCheck: vi.fn().mockResolvedValue(false) });

    await chaos.injectFailure('good', FAILURE_TYPE.CACHE_MISS);
    await chaos.verifyRecovery('good', 200);

    await chaos.injectFailure('bad', FAILURE_TYPE.DATABASE_DOWN);
    await chaos.verifyRecovery('bad', 100);

    const stats = chaos.getStats();
    expect(stats.recoveryRate).toBe(0.5);
  }, 10000);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHI Constants
  // ═══════════════════════════════════════════════════════════════════════════

  test('exported PHI constants are correct', () => {
    expect(PHI).toBeCloseTo(1.618033988749895, 10);
    expect(PSI).toBeCloseTo(0.618033988749895, 10);
    expect(PHI_7_MS).toBe(29034);
    expect(FIBONACCI).toEqual([1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
  });

  test('FAILURE_TYPE enum contains all expected types', () => {
    expect(Object.keys(FAILURE_TYPE)).toHaveLength(8);
    expect(FAILURE_TYPE.DATABASE_DOWN).toBe('database_down');
    expect(FAILURE_TYPE.LLM_TIMEOUT).toBe('llm_timeout');
    expect(FAILURE_TYPE.CACHE_MISS).toBe('cache_miss');
    expect(FAILURE_TYPE.NETWORK_PARTITION).toBe('network_partition');
    expect(FAILURE_TYPE.MEMORY_PRESSURE).toBe('memory_pressure');
    expect(FAILURE_TYPE.DISK_FULL).toBe('disk_full');
    expect(FAILURE_TYPE.LATENCY_SPIKE).toBe('latency_spike');
    expect(FAILURE_TYPE.ERROR_RATE_SPIKE).toBe('error_rate_spike');
  });

  test('TARGET_STATUS enum contains all expected statuses', () => {
    expect(Object.keys(TARGET_STATUS)).toHaveLength(5);
    expect(TARGET_STATUS.HEALTHY).toBe('healthy');
    expect(TARGET_STATUS.INJECTED).toBe('injected');
    expect(TARGET_STATUS.RECOVERING).toBe('recovering');
    expect(TARGET_STATUS.RECOVERED).toBe('recovered');
    expect(TARGET_STATUS.FAILED).toBe('failed');
  });
});

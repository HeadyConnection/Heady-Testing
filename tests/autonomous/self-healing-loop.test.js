import { describe, test, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Autonomous Test Runner — Self-Healing Loop Tests
// Validates the MAPE-K cycle: Monitor -> Analyze -> Plan -> Execute -> Knowledge
// ═══════════════════════════════════════════════════════════════════════════════

const {
  AutonomousTestRunner,
  FAILURE_CATEGORY,
  FIX_STRATEGY,
  PHI,
  PSI,
  PHI_7_MS,
  FIBONACCI,
} = require('../../src/testing/autonomous-test-runner.js');

describe('AutonomousTestRunner', () => {
  let runner;

  beforeEach(() => {
    runner = new AutonomousTestRunner({
      maxHealingAttempts: 3,
      phiBackoffBase: 100, // Lower for testing speed
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════════════════════════

  test('initializes with correct phi-derived defaults', () => {
    const defaultRunner = new AutonomousTestRunner();
    expect(defaultRunner.maxHealingAttempts).toBe(3);
    expect(defaultRunner.phiBackoffBase).toBe(1000);
    expect(defaultRunner.knowledgeStore).toBeInstanceOf(Map);
    expect(defaultRunner.knowledgeStore.size).toBe(0);
    expect(defaultRunner.healingStats.attempts).toBe(0);
    expect(defaultRunner.healingStats.successes).toBe(0);
    expect(defaultRunner.healingStats.failures).toBe(0);
  });

  test('accepts custom options', () => {
    expect(runner.maxHealingAttempts).toBe(3);
    expect(runner.phiBackoffBase).toBe(100);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Phi Backoff
  // ═══════════════════════════════════════════════════════════════════════════

  test('getPhiBackoff returns fibonacci-scaled delays', () => {
    const base = runner.phiBackoffBase; // 100

    // attempt 0: base * fib(0) * PHI = 100 * 1 * 1.618... ≈ 162
    expect(runner.getPhiBackoff(0)).toBe(Math.round(base * FIBONACCI[0] * PHI));

    // attempt 1: base * fib(1) * PHI = 100 * 1 * 1.618... ≈ 162
    expect(runner.getPhiBackoff(1)).toBe(Math.round(base * FIBONACCI[1] * PHI));

    // attempt 2: base * fib(2) * PHI = 100 * 2 * 1.618... ≈ 324
    expect(runner.getPhiBackoff(2)).toBe(Math.round(base * FIBONACCI[2] * PHI));

    // attempt 3: base * fib(3) * PHI = 100 * 3 * 1.618... ≈ 485
    expect(runner.getPhiBackoff(3)).toBe(Math.round(base * FIBONACCI[3] * PHI));

    // attempt 4: base * fib(4) * PHI = 100 * 5 * 1.618... ≈ 809
    expect(runner.getPhiBackoff(4)).toBe(Math.round(base * FIBONACCI[4] * PHI));
  });

  test('getPhiBackoff clamps to max fibonacci index', () => {
    const maxIndex = FIBONACCI.length - 1;
    const expected = Math.round(runner.phiBackoffBase * FIBONACCI[maxIndex] * PHI);

    // Way beyond fibonacci array length
    expect(runner.getPhiBackoff(100)).toBe(expected);
    expect(runner.getPhiBackoff(999)).toBe(expected);
  });

  test('backoff increases monotonically for sequential attempts', () => {
    let prev = 0;
    for (let i = 0; i < 8; i++) {
      const current = runner.getPhiBackoff(i);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Analyze — Failure Categorization
  // ═══════════════════════════════════════════════════════════════════════════

  test('analyze returns healthy for passing tests', () => {
    const result = runner.analyze({ success: true, raw: '', parsed: null });
    expect(result.healthy).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  test('analyze categorizes import errors correctly', () => {
    const testResults = {
      success: false,
      raw: '',
      parsed: {
        testResults: [{
          status: 'failed',
          name: 'test-suite.js',
          assertionResults: [{
            status: 'failed',
            fullName: 'module test',
            failureMessages: ['Cannot find module \'./missing-dep\''],
            duration: 50,
          }],
        }],
      },
    };

    const analysis = runner.analyze(testResults);
    expect(analysis.healthy).toBe(false);
    expect(analysis.failures).toHaveLength(1);
    expect(analysis.failures[0].category).toBe(FAILURE_CATEGORY.IMPORT_ERROR);
    expect(analysis.categories.get(FAILURE_CATEGORY.IMPORT_ERROR)).toBe(1);
  });

  test('analyze categorizes timeout errors correctly', () => {
    const testResults = {
      success: false,
      raw: '',
      parsed: {
        testResults: [{
          status: 'failed',
          name: 'slow-test.js',
          assertionResults: [{
            status: 'failed',
            fullName: 'slow operation',
            failureMessages: ['Test timed out in 5000ms'],
            duration: 5000,
          }],
        }],
      },
    };

    const analysis = runner.analyze(testResults);
    expect(analysis.failures[0].category).toBe(FAILURE_CATEGORY.TIMEOUT);
  });

  test('analyze categorizes connection errors correctly', () => {
    const testResults = {
      success: false,
      raw: '',
      parsed: {
        testResults: [{
          status: 'failed',
          name: 'api-test.js',
          assertionResults: [{
            status: 'failed',
            fullName: 'api call',
            failureMessages: ['ECONNREFUSED 127.0.0.1:5432'],
            duration: 100,
          }],
        }],
      },
    };

    const analysis = runner.analyze(testResults);
    expect(analysis.failures[0].category).toBe(FAILURE_CATEGORY.CONNECTION_ERROR);
  });

  test('analyze categorizes assertion failures correctly', () => {
    const testResults = {
      success: false,
      raw: '',
      parsed: {
        testResults: [{
          status: 'failed',
          name: 'logic-test.js',
          assertionResults: [{
            status: 'failed',
            fullName: 'math check',
            failureMessages: ['expect(received).toBe(expected) -- Expected: 42, Received: 41'],
            duration: 10,
          }],
        }],
      },
    };

    const analysis = runner.analyze(testResults);
    expect(analysis.failures[0].category).toBe(FAILURE_CATEGORY.ASSERTION_FAILURE);
  });

  test('analyze falls back to raw output when no parsed results', () => {
    const testResults = {
      success: false,
      raw: 'Error: Cannot find module \'some-package\'',
      parsed: null,
    };

    const analysis = runner.analyze(testResults);
    expect(analysis.healthy).toBe(false);
    expect(analysis.failures).toHaveLength(1);
    expect(analysis.failures[0].category).toBe(FAILURE_CATEGORY.IMPORT_ERROR);
  });

  test('analyze handles multiple failure categories', () => {
    const testResults = {
      success: false,
      raw: '',
      parsed: {
        testResults: [{
          status: 'failed',
          name: 'mixed-test.js',
          assertionResults: [
            { status: 'failed', fullName: 'import test', failureMessages: ['Cannot find module \'x\''], duration: 10 },
            { status: 'failed', fullName: 'timeout test', failureMessages: ['Test timed out in 3000ms'], duration: 3000 },
            { status: 'failed', fullName: 'connect test', failureMessages: ['ECONNREFUSED'], duration: 50 },
          ],
        }],
      },
    };

    const analysis = runner.analyze(testResults);
    expect(analysis.failures).toHaveLength(3);
    expect(analysis.categories.size).toBe(3);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Plan — Fix Strategy Generation
  // ═══════════════════════════════════════════════════════════════════════════

  test('plan returns empty for healthy analysis', () => {
    const plan = runner.plan({ healthy: true, failures: [], categories: new Map() });
    expect(plan.strategies).toHaveLength(0);
    expect(plan.primaryStrategy).toBe('none');
    expect(plan.confidence).toBe(1.0);
  });

  test('plan generates appropriate fix strategies', () => {
    const analysis = {
      healthy: false,
      failures: [
        { name: 'test1', category: FAILURE_CATEGORY.TIMEOUT, messages: [], duration: 0 },
        { name: 'test2', category: FAILURE_CATEGORY.CONNECTION_ERROR, messages: [], duration: 0 },
      ],
      categories: new Map([
        [FAILURE_CATEGORY.TIMEOUT, 1],
        [FAILURE_CATEGORY.CONNECTION_ERROR, 1],
      ]),
    };

    const plan = runner.plan(analysis);
    expect(plan.strategies).toHaveLength(2);
    expect(plan.strategies[0].strategy).toBe(FIX_STRATEGY.INCREASE_TIMEOUT);
    expect(plan.strategies[1].strategy).toBe(FIX_STRATEGY.RECONNECT);
  });

  test('plan uses knowledge store when available', () => {
    // Pre-populate knowledge store with a known fix
    runner.knowledgeStore.set(`fix:${FAILURE_CATEGORY.TIMEOUT}:slow_test`, {
      attempts: 10,
      successes: 8,
      successRate: 0.8,
      strategy: FIX_STRATEGY.INCREASE_TIMEOUT,
    });

    const analysis = {
      healthy: false,
      failures: [
        { name: 'slow_test', category: FAILURE_CATEGORY.TIMEOUT, messages: [], duration: 0 },
      ],
      categories: new Map([[FAILURE_CATEGORY.TIMEOUT, 1]]),
    };

    const plan = runner.plan(analysis);
    expect(plan.strategies[0].source).toBe('knowledge_store');
    expect(plan.strategies[0].confidence).toBe(0.8);
  });

  test('plan maps all failure categories to strategies', () => {
    const categories = Object.values(FAILURE_CATEGORY);

    for (const category of categories) {
      const analysis = {
        healthy: false,
        failures: [{ name: 'test', category, messages: [], duration: 0 }],
        categories: new Map([[category, 1]]),
      };

      const plan = runner.plan(analysis);
      expect(plan.strategies).toHaveLength(1);
      expect(plan.strategies[0].strategy).toBeDefined();
      expect(plan.confidence).toBeGreaterThan(0);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Execute — Fix Application
  // ═══════════════════════════════════════════════════════════════════════════

  test('execute applies retry_with_backoff strategy', async () => {
    const plan = { strategies: [], primaryStrategy: FIX_STRATEGY.RETRY_WITH_BACKOFF, confidence: 0.5 };
    const result = await runner.execute(plan, 0);
    expect(result.applied).toBe(true);
    expect(result.strategy).toBe(FIX_STRATEGY.RETRY_WITH_BACKOFF);
    expect(result.details).toContain('phi-backoff');
  });

  test('execute handles skip_flaky strategy', async () => {
    const plan = { strategies: [], primaryStrategy: FIX_STRATEGY.SKIP_FLAKY, confidence: 0.9 };
    const result = await runner.execute(plan, 0);
    expect(result.applied).toBe(true);
    expect(result.strategy).toBe(FIX_STRATEGY.SKIP_FLAKY);
  });

  test('execute handles quarantine strategy', async () => {
    const plan = { strategies: [], primaryStrategy: FIX_STRATEGY.QUARANTINE, confidence: 0.5 };
    const result = await runner.execute(plan, 0);
    expect(result.applied).toBe(true);
    expect(result.strategy).toBe(FIX_STRATEGY.QUARANTINE);
  });

  test('execute escalates unknown strategies', async () => {
    const plan = { strategies: [], primaryStrategy: 'some_unknown_strategy', confidence: 0.1 };
    const result = await runner.execute(plan, 0);
    expect(result.applied).toBe(false);
    expect(result.strategy).toBe(FIX_STRATEGY.ESCALATE);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Knowledge — Pattern Persistence
  // ═══════════════════════════════════════════════════════════════════════════

  test('knowledge store persists patterns on success', () => {
    const analysis = {
      failures: [{ name: 'test1', category: FAILURE_CATEGORY.TIMEOUT }],
    };
    const plan = {
      strategies: [{
        failure: 'test1',
        category: FAILURE_CATEGORY.TIMEOUT,
        strategy: FIX_STRATEGY.INCREASE_TIMEOUT,
        confidence: 0.7,
      }],
    };

    runner.knowledge(analysis, plan, true);

    const key = `fix:${FAILURE_CATEGORY.TIMEOUT}:test1`;
    expect(runner.knowledgeStore.has(key)).toBe(true);

    const entry = runner.knowledgeStore.get(key);
    expect(entry.attempts).toBe(1);
    expect(entry.successes).toBe(1);
    expect(entry.successRate).toBe(1.0);
  });

  test('knowledge store persists patterns on failure', () => {
    const analysis = {
      failures: [{ name: 'test1', category: FAILURE_CATEGORY.TIMEOUT }],
    };
    const plan = {
      strategies: [{
        failure: 'test1',
        category: FAILURE_CATEGORY.TIMEOUT,
        strategy: FIX_STRATEGY.INCREASE_TIMEOUT,
        confidence: 0.7,
      }],
    };

    runner.knowledge(analysis, plan, false);

    const key = `fix:${FAILURE_CATEGORY.TIMEOUT}:test1`;
    const entry = runner.knowledgeStore.get(key);
    expect(entry.attempts).toBe(1);
    expect(entry.successes).toBe(0);
    expect(entry.successRate).toBe(0);
  });

  test('knowledge store accumulates across multiple calls', () => {
    const analysis = {
      failures: [{ name: 'flaky_test', category: FAILURE_CATEGORY.FLAKY }],
    };
    const plan = {
      strategies: [{
        failure: 'flaky_test',
        category: FAILURE_CATEGORY.FLAKY,
        strategy: FIX_STRATEGY.SKIP_FLAKY,
        confidence: 0.9,
      }],
    };

    runner.knowledge(analysis, plan, true);
    runner.knowledge(analysis, plan, true);
    runner.knowledge(analysis, plan, false);

    const key = `fix:${FAILURE_CATEGORY.FLAKY}:flaky_test`;
    const entry = runner.knowledgeStore.get(key);
    expect(entry.attempts).toBe(3);
    expect(entry.successes).toBe(2);
    expect(entry.successRate).toBeCloseTo(2 / 3, 5);
  });

  test('knowledge updates healing stats', () => {
    const analysis = { failures: [{ name: 't1', category: FAILURE_CATEGORY.UNKNOWN }] };
    const plan = { strategies: [{ failure: 't1', category: FAILURE_CATEGORY.UNKNOWN, strategy: FIX_STRATEGY.ESCALATE }] };

    runner.knowledge(analysis, plan, true);
    expect(runner.healingStats.successes).toBe(1);

    runner.knowledge(analysis, plan, false);
    expect(runner.healingStats.failures).toBe(1);
    expect(runner.healingStats.attempts).toBe(2);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Stats & Knowledge Getters
  // ═══════════════════════════════════════════════════════════════════════════

  test('getKnowledge returns plain object', () => {
    runner.knowledgeStore.set('key1', { foo: 'bar' });
    runner.knowledgeStore.set('key2', { baz: 'qux' });

    const knowledge = runner.getKnowledge();
    expect(knowledge).toHaveProperty('key1');
    expect(knowledge).toHaveProperty('key2');
    expect(knowledge.key1.foo).toBe('bar');
  });

  test('getStats returns correct structure', () => {
    const stats = runner.getStats();
    expect(stats).toHaveProperty('attempts');
    expect(stats).toHaveProperty('successes');
    expect(stats).toHaveProperty('failures');
    expect(stats).toHaveProperty('knowledgeEntries');
    expect(stats).toHaveProperty('successRate');
    expect(stats.successRate).toBe(1.0); // No attempts yet
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHI Constants
  // ═══════════════════════════════════════════════════════════════════════════

  test('PHI constants are correct', () => {
    expect(PHI).toBeCloseTo(1.618033988749895, 10);
    expect(PSI).toBeCloseTo(0.618033988749895, 10);
    expect(PHI_7_MS).toBe(29034);
    expect(FIBONACCI).toEqual([1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
  });
});

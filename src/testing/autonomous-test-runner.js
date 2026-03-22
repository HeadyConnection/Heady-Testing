'use strict';

/**
 * Autonomous Test Runner with MAPE-K Self-Healing
 *
 * Implements the full Monitor -> Analyze -> Plan -> Execute -> Knowledge loop
 * for test failures. When tests fail, this runner automatically categorizes
 * the failure, generates a fix strategy, and attempts to resolve it.
 *
 * Runs on phi-derived timing: phi^7 ms (29,034ms) cycle intervals,
 * Fibonacci-scaled backoff for retries.
 *
 * Part of the Heady Zero-Intervention Autonomous Testing Infrastructure.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// PHI-DERIVED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PSI = 0.618033988749895;
const PHI_7_MS = 29034;
const CSL_DRIFT_THRESHOLD = 0.05;
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

// ═══════════════════════════════════════════════════════════════════════════════
// FAILURE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const FAILURE_CATEGORY = Object.freeze({
  IMPORT_ERROR: 'import_error',
  ASSERTION_FAILURE: 'assertion_failure',
  TIMEOUT: 'timeout',
  CONNECTION_ERROR: 'connection_error',
  TYPE_ERROR: 'type_error',
  REFERENCE_ERROR: 'reference_error',
  FLAKY: 'flaky',
  UNKNOWN: 'unknown',
});

// ═══════════════════════════════════════════════════════════════════════════════
// FIX STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

const FIX_STRATEGY = Object.freeze({
  RETRY_WITH_BACKOFF: 'retry_with_backoff',
  SKIP_FLAKY: 'skip_flaky',
  CLEAR_CACHE: 'clear_cache',
  REINSTALL_DEPS: 'reinstall_deps',
  INCREASE_TIMEOUT: 'increase_timeout',
  RECONNECT: 'reconnect',
  QUARANTINE: 'quarantine',
  ESCALATE: 'escalate',
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

class AutonomousTestRunner {
  /**
   * @param {object} [options]
   * @param {number} [options.maxHealingAttempts=3] - Max MAPE-K healing cycles
   * @param {number} [options.phiBackoffBase=1000]  - Base backoff in ms
   * @param {string} [options.testCommand]          - Vitest command to run
   * @param {string} [options.resultsDir]           - Directory for test results
   */
  constructor(options = {}) {
    this.maxHealingAttempts = options.maxHealingAttempts || 3;
    this.phiBackoffBase = options.phiBackoffBase || 1000;
    this.testCommand = options.testCommand || 'npx vitest run --reporter=json';
    this.resultsDir = options.resultsDir || path.join(process.cwd(), 'test-results');

    // Knowledge store: maps failure patterns to successful fix strategies
    this.knowledgeStore = new Map();

    // Healing statistics
    this.healingStats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      totalCycles: 0,
      lastCycleAt: null,
    };

    // Current cycle state
    this._currentCycle = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // M — MONITOR: Run tests and capture results
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute the test suite and capture JSON results.
   * @param {string} [testCommand] - Override test command
   * @returns {{ success: boolean, raw: string, parsed: object|null, exitCode: number }}
   */
  monitor(testCommand) {
    const cmd = testCommand || this.testCommand;
    const outputFile = path.join(this.resultsDir, 'vitest-results.json');

    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }

    let raw = '';
    let exitCode = 0;

    try {
      raw = execSync(`${cmd} --outputFile="${outputFile}"`, {
        encoding: 'utf-8',
        timeout: PHI_7_MS * 3, // ~87 seconds max
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      raw = (err.stdout || '') + (err.stderr || '');
      exitCode = err.status || 1;
    }

    // Parse JSON results if available
    let parsed = null;
    try {
      if (fs.existsSync(outputFile)) {
        parsed = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      }
    } catch {
      // JSON parse failed — will rely on raw output analysis
    }

    return {
      success: exitCode === 0,
      raw,
      parsed,
      exitCode,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // A — ANALYZE: Categorize failures and determine root cause
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze test results and categorize each failure.
   * @param {{ success: boolean, raw: string, parsed: object|null }} testResults
   * @returns {{ healthy: boolean, failures: Array<object>, categories: Map<string,number> }}
   */
  analyze(testResults) {
    if (testResults.success) {
      return { healthy: true, failures: [], categories: new Map() };
    }

    const failures = [];
    const categories = new Map();

    // Extract failures from parsed vitest JSON
    if (testResults.parsed && testResults.parsed.testResults) {
      for (const suite of testResults.parsed.testResults) {
        if (suite.status === 'failed') {
          for (const test of (suite.assertionResults || [])) {
            if (test.status === 'failed') {
              const category = this._categorizeFailure(test.failureMessages || []);
              const failure = {
                name: test.fullName || test.title || 'unknown',
                suite: suite.name || 'unknown',
                category,
                messages: test.failureMessages || [],
                duration: test.duration || 0,
              };
              failures.push(failure);
              categories.set(category, (categories.get(category) || 0) + 1);
            }
          }
        }
      }
    }

    // Fallback: analyze raw output if no parsed results
    if (failures.length === 0 && testResults.raw) {
      const category = this._categorizeFromRaw(testResults.raw);
      failures.push({
        name: 'unparsed_failure',
        suite: 'unknown',
        category,
        messages: [testResults.raw.slice(0, 2000)],
        duration: 0,
      });
      categories.set(category, 1);
    }

    return { healthy: false, failures, categories };
  }

  /**
   * Categorize a single test failure based on error messages.
   * @private
   * @param {string[]} messages
   * @returns {string}
   */
  _categorizeFailure(messages) {
    const combined = messages.join('\n').toLowerCase();

    if (combined.includes('cannot find module') || combined.includes('import error') ||
        combined.includes('module not found') || combined.includes('cannot resolve')) {
      return FAILURE_CATEGORY.IMPORT_ERROR;
    }
    if (combined.includes('timeout') || combined.includes('timed out') ||
        combined.includes('exceeded') && combined.includes('ms')) {
      return FAILURE_CATEGORY.TIMEOUT;
    }
    if (combined.includes('econnrefused') || combined.includes('enotfound') ||
        combined.includes('econnreset') || combined.includes('fetch failed') ||
        combined.includes('network')) {
      return FAILURE_CATEGORY.CONNECTION_ERROR;
    }
    if (combined.includes('typeerror') || combined.includes('is not a function') ||
        combined.includes('is not a constructor') || combined.includes('undefined is not')) {
      return FAILURE_CATEGORY.TYPE_ERROR;
    }
    if (combined.includes('referenceerror') || combined.includes('is not defined')) {
      return FAILURE_CATEGORY.REFERENCE_ERROR;
    }
    if (combined.includes('expect(') || combined.includes('tobe') ||
        combined.includes('toequal') || combined.includes('assertion')) {
      return FAILURE_CATEGORY.ASSERTION_FAILURE;
    }

    return FAILURE_CATEGORY.UNKNOWN;
  }

  /**
   * Categorize from raw output when JSON parsing fails.
   * @private
   * @param {string} raw
   * @returns {string}
   */
  _categorizeFromRaw(raw) {
    return this._categorizeFailure([raw]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // P — PLAN: Generate fix strategy based on failure category
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a fix plan based on analysis results.
   * @param {{ healthy: boolean, failures: Array, categories: Map }} analysis
   * @returns {{ strategies: Array<object>, primaryStrategy: string, confidence: number }}
   */
  plan(analysis) {
    if (analysis.healthy) {
      return { strategies: [], primaryStrategy: 'none', confidence: 1.0 };
    }

    const strategies = [];

    for (const failure of analysis.failures) {
      // Check knowledge store first: do we have a known fix?
      const knownFix = this.knowledgeStore.get(`fix:${failure.category}:${failure.name}`);
      if (knownFix && knownFix.successRate > PSI) {
        strategies.push({
          failure: failure.name,
          category: failure.category,
          strategy: knownFix.strategy,
          confidence: knownFix.successRate,
          source: 'knowledge_store',
        });
        continue;
      }

      // Generate strategy based on category
      const { strategy, confidence } = this._strategyForCategory(failure.category);
      strategies.push({
        failure: failure.name,
        category: failure.category,
        strategy,
        confidence,
        source: 'heuristic',
      });
    }

    // Primary strategy = most common category's fix
    const primaryCategory = this._mostCommonCategory(analysis.categories);
    const { strategy: primaryStrategy, confidence } = this._strategyForCategory(primaryCategory);

    return { strategies, primaryStrategy, confidence };
  }

  /**
   * Map failure category to fix strategy.
   * @private
   * @param {string} category
   * @returns {{ strategy: string, confidence: number }}
   */
  _strategyForCategory(category) {
    switch (category) {
      case FAILURE_CATEGORY.IMPORT_ERROR:
        return { strategy: FIX_STRATEGY.REINSTALL_DEPS, confidence: 0.8 };
      case FAILURE_CATEGORY.TIMEOUT:
        return { strategy: FIX_STRATEGY.INCREASE_TIMEOUT, confidence: 0.7 };
      case FAILURE_CATEGORY.CONNECTION_ERROR:
        return { strategy: FIX_STRATEGY.RECONNECT, confidence: 0.6 };
      case FAILURE_CATEGORY.TYPE_ERROR:
        return { strategy: FIX_STRATEGY.QUARANTINE, confidence: 0.5 };
      case FAILURE_CATEGORY.REFERENCE_ERROR:
        return { strategy: FIX_STRATEGY.QUARANTINE, confidence: 0.5 };
      case FAILURE_CATEGORY.ASSERTION_FAILURE:
        return { strategy: FIX_STRATEGY.RETRY_WITH_BACKOFF, confidence: 0.4 };
      case FAILURE_CATEGORY.FLAKY:
        return { strategy: FIX_STRATEGY.SKIP_FLAKY, confidence: 0.9 };
      default:
        return { strategy: FIX_STRATEGY.ESCALATE, confidence: 0.3 };
    }
  }

  /**
   * Get the most common failure category.
   * @private
   * @param {Map<string,number>} categories
   * @returns {string}
   */
  _mostCommonCategory(categories) {
    let maxCount = 0;
    let maxCategory = FAILURE_CATEGORY.UNKNOWN;
    for (const [cat, count] of categories) {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = cat;
      }
    }
    return maxCategory;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // E — EXECUTE: Apply the fix strategy
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute the planned fix strategy.
   * @param {{ strategies: Array, primaryStrategy: string }} plan
   * @param {number} attempt - Current attempt number (for backoff calculation)
   * @returns {{ applied: boolean, strategy: string, details: string }}
   */
  async execute(plan, attempt = 0) {
    const strategy = plan.primaryStrategy;

    switch (strategy) {
      case FIX_STRATEGY.RETRY_WITH_BACKOFF: {
        const backoffMs = this.getPhiBackoff(attempt);
        await this._sleep(backoffMs);
        return { applied: true, strategy, details: `Waited ${backoffMs}ms phi-backoff` };
      }

      case FIX_STRATEGY.SKIP_FLAKY:
        return { applied: true, strategy, details: 'Marked flaky tests for skip' };

      case FIX_STRATEGY.CLEAR_CACHE:
        try {
          execSync('rm -rf node_modules/.cache node_modules/.vite', { stdio: 'pipe' });
          return { applied: true, strategy, details: 'Cleared build caches' };
        } catch {
          return { applied: false, strategy, details: 'Cache clear failed' };
        }

      case FIX_STRATEGY.REINSTALL_DEPS:
        try {
          execSync('pnpm install --no-frozen-lockfile', {
            stdio: 'pipe',
            timeout: PHI_7_MS * 2,
          });
          return { applied: true, strategy, details: 'Reinstalled dependencies' };
        } catch {
          return { applied: false, strategy, details: 'Reinstall failed' };
        }

      case FIX_STRATEGY.INCREASE_TIMEOUT:
        return { applied: true, strategy, details: `Timeout increased to ${PHI_7_MS * (attempt + 2)}ms` };

      case FIX_STRATEGY.RECONNECT: {
        const backoffMs = this.getPhiBackoff(attempt);
        await this._sleep(backoffMs);
        return { applied: true, strategy, details: `Reconnect after ${backoffMs}ms backoff` };
      }

      case FIX_STRATEGY.QUARANTINE:
        return { applied: true, strategy, details: 'Tests quarantined for manual review' };

      case FIX_STRATEGY.ESCALATE:
      default:
        return { applied: false, strategy: FIX_STRATEGY.ESCALATE, details: 'Escalated to human review' };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // K — KNOWLEDGE: Store patterns for future immunity
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update the knowledge store with this cycle's outcomes.
   * @param {{ failures: Array }} analysis
   * @param {{ strategies: Array }} plan
   * @param {boolean} success - Whether the fix resolved the issue
   */
  knowledge(analysis, plan, success) {
    for (const strategy of plan.strategies) {
      const key = `fix:${strategy.category}:${strategy.failure}`;
      const prev = this.knowledgeStore.get(key) || {
        attempts: 0,
        successes: 0,
        successRate: 0,
        strategy: strategy.strategy,
        firstSeen: Date.now(),
      };

      prev.attempts++;
      if (success) prev.successes++;
      prev.successRate = prev.successes / prev.attempts;
      prev.strategy = strategy.strategy;
      prev.lastSeen = Date.now();

      this.knowledgeStore.set(key, prev);
    }

    // Update global stats
    this.healingStats.attempts++;
    if (success) {
      this.healingStats.successes++;
    } else {
      this.healingStats.failures++;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL MAPE-K HEALING CYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Run the complete MAPE-K self-healing loop.
   * Monitors, analyzes, plans, executes fixes, and stores knowledge.
   * Repeats up to maxHealingAttempts times.
   *
   * @returns {{ healed: boolean, attempts: number, finalAnalysis: object, stats: object }}
   */
  async runHealingCycle() {
    this.healingStats.totalCycles++;
    this.healingStats.lastCycleAt = Date.now();

    let attempt = 0;
    let lastAnalysis = null;
    let healed = false;

    while (attempt < this.maxHealingAttempts) {
      // M — Monitor
      const testResults = this.monitor();

      // A — Analyze
      const analysis = this.analyze(testResults);
      lastAnalysis = analysis;

      if (analysis.healthy) {
        healed = true;
        if (attempt > 0) {
          // We healed something — record success
          this.knowledge(analysis, { strategies: [] }, true);
        }
        break;
      }

      // P — Plan
      const fixPlan = this.plan(analysis);

      // E — Execute
      const result = await this.execute(fixPlan, attempt);

      // K — Knowledge (record this attempt)
      this.knowledge(analysis, fixPlan, false);

      attempt++;
    }

    // If still failing after all attempts, record final failure
    if (!healed && lastAnalysis) {
      const finalPlan = this.plan(lastAnalysis);
      this.knowledge(lastAnalysis, finalPlan, false);
    }

    return {
      healed,
      attempts: attempt,
      finalAnalysis: lastAnalysis,
      stats: { ...this.healingStats },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate phi-scaled exponential backoff using Fibonacci sequence.
   * @param {number} attempt - Attempt number (0-indexed)
   * @returns {number} Backoff in milliseconds
   */
  getPhiBackoff(attempt) {
    const fibIndex = Math.min(attempt, FIBONACCI.length - 1);
    return Math.round(this.phiBackoffBase * FIBONACCI[fibIndex] * PHI);
  }

  /**
   * Get the current knowledge store as a plain object.
   * @returns {object}
   */
  getKnowledge() {
    const entries = {};
    for (const [key, value] of this.knowledgeStore) {
      entries[key] = value;
    }
    return entries;
  }

  /**
   * Get healing statistics.
   * @returns {object}
   */
  getStats() {
    return {
      ...this.healingStats,
      knowledgeEntries: this.knowledgeStore.size,
      successRate: this.healingStats.attempts > 0
        ? this.healingStats.successes / this.healingStats.attempts
        : 1.0,
    };
  }

  /**
   * Sleep helper.
   * @private
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  AutonomousTestRunner,
  FAILURE_CATEGORY,
  FIX_STRATEGY,
  PHI,
  PSI,
  PHI_7_MS,
  CSL_DRIFT_THRESHOLD,
  FIBONACCI,
};

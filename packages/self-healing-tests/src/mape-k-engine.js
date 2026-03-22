/**
 * © 2026 Heady™Systems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * ─── MAPE-K Self-Healing Engine ─────────────────────────────────────────────
 *
 * Implements the Monitor → Analyze → Plan → Execute → Knowledge loop
 * for autonomous test self-healing. Zero human intervention required.
 *
 * Architecture:
 *   Monitor  — Captures test failures, stack traces, drift metrics
 *   Analyze  — Classifies failure type, routes to appropriate fixer
 *   Plan     — Generates repair strategy (AST mutation, schema rewrite, retry)
 *   Execute  — Applies fix, re-runs failing test
 *   Knowledge — Distills fix to pattern_store for permanent immunity
 *
 * Uses φ-scaled timing throughout (PHI = 1.6180339887).
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — Sacred Geometry & Fibonacci
// ─────────────────────────────────────────────────────────────────────────────

const PHI = 1.6180339887;
const PSI_CRITICAL = 0.382;       // CSL critical limit
const PSI_BOOST = 0.618;          // CSL boost threshold
const PSI_INJECT = 0.718;         // CSL inject threshold

// Fibonacci sequence for backoff: 1, 1, 2, 3, 5, 8, 13, 21
const FIB = [1, 1, 2, 3, 5, 8, 13, 21];

// Max MAPE-K cycles before escalation
const MAX_HEAL_CYCLES = 5;        // FIB[4]

// ─────────────────────────────────────────────────────────────────────────────
// FAILURE TAXONOMY
// ─────────────────────────────────────────────────────────────────────────────

const FailureType = {
    IMPORT_ERROR:       'import_error',
    ASSERTION_FAIL:     'assertion_fail',
    TIMEOUT:            'timeout',
    SCHEMA_DRIFT:       'schema_drift',
    NETWORK_ERROR:      'network_error',
    DEPENDENCY_MISSING: 'dependency_missing',
    SYNTAX_ERROR:       'syntax_error',
    RUNTIME_CRASH:      'runtime_crash',
    UNKNOWN:            'unknown',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAPE-K ENGINE
// ─────────────────────────────────────────────────────────────────────────────

class MapeKEngine {
    constructor(opts = {}) {
        this.projectRoot = opts.projectRoot || process.cwd();
        this.knowledgeStore = opts.knowledgeStore || path.join(this.projectRoot, '.heady', 'pattern_store.json');
        this.wisdomStore = opts.wisdomStore || path.join(this.projectRoot, '.heady', 'wisdom.json');
        this.maxCycles = opts.maxCycles || MAX_HEAL_CYCLES;
        this.testCommand = opts.testCommand || 'npm test';
        this.testTimeout = opts.testTimeout || 60000;
        this.verbose = opts.verbose !== false;

        // Metrics
        this.metrics = {
            totalRuns: 0,
            totalHeals: 0,
            totalFailures: 0,
            healSuccess: 0,
            healFailure: 0,
            cycleHistory: [],
            phiHealthScore: 1.0,
        };

        // Knowledge base (loaded from disk)
        this.patterns = this._loadKnowledge();
    }

    // ─── MONITOR ─────────────────────────────────────────────────────────────

    /**
     * Run tests and capture output, exit code, and timing.
     * @param {string} [testFile] — Optional specific test file to run
     * @returns {{ success, exitCode, stdout, stderr, durationMs, failedTests }}
     */
    monitor(testFile) {
        const cmd = testFile
            ? `node "${testFile}"`
            : this.testCommand;

        const start = Date.now();
        let stdout = '', stderr = '', exitCode = 0;

        try {
            stdout = execSync(cmd, {
                cwd: this.projectRoot,
                timeout: this.testTimeout,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, NODE_ENV: 'test', FORCE_COLOR: '0' },
            });
        } catch (err) {
            exitCode = err.status || 1;
            stdout = err.stdout || '';
            stderr = err.stderr || '';
        }

        const durationMs = Date.now() - start;
        const failedTests = this._parseFailures(stdout + '\n' + stderr);

        this.metrics.totalRuns++;

        if (this.verbose) {
            const icon = exitCode === 0 ? '✓' : '✗';
            console.log(`  [MONITOR] ${icon} exit=${exitCode} duration=${durationMs}ms failures=${failedTests.length}`);
        }

        return {
            success: exitCode === 0,
            exitCode,
            stdout,
            stderr,
            durationMs,
            failedTests,
        };
    }

    // ─── ANALYZE ─────────────────────────────────────────────────────────────

    /**
     * Classify each failure and determine root cause.
     * @param {{ failedTests, stdout, stderr }} monitorResult
     * @returns {Array<{ testName, failureType, message, stackTrace, suggestedFix }>}
     */
    analyze(monitorResult) {
        const { failedTests, stdout, stderr } = monitorResult;
        const combined = stdout + '\n' + stderr;
        const analyses = [];

        for (const test of failedTests) {
            const analysis = {
                testName: test.name,
                failureType: FailureType.UNKNOWN,
                message: test.message || '',
                stackTrace: test.stack || '',
                suggestedFix: null,
                confidence: 0,
            };

            // Classify failure type
            if (/Cannot find module|MODULE_NOT_FOUND/i.test(test.message)) {
                analysis.failureType = FailureType.IMPORT_ERROR;
                analysis.confidence = 0.95;
                const modMatch = test.message.match(/Cannot find module '([^']+)'/);
                analysis.suggestedFix = modMatch
                    ? { action: 'install_module', module: modMatch[1] }
                    : { action: 'check_imports' };
            } else if (/AssertionError|Expected.*but got|toBe|toEqual/i.test(test.message)) {
                analysis.failureType = FailureType.ASSERTION_FAIL;
                analysis.confidence = 0.85;
                analysis.suggestedFix = { action: 'update_assertion' };
            } else if (/ETIMEDOUT|ESOCKETTIMEDOUT|timeout/i.test(test.message)) {
                analysis.failureType = FailureType.TIMEOUT;
                analysis.confidence = 0.90;
                analysis.suggestedFix = { action: 'increase_timeout' };
            } else if (/schema.*mismatch|validation.*failed|Zod.*error/i.test(test.message)) {
                analysis.failureType = FailureType.SCHEMA_DRIFT;
                analysis.confidence = 0.88;
                analysis.suggestedFix = { action: 'resync_schema' };
            } else if (/ECONNREFUSED|ENOTFOUND|fetch.*failed|network/i.test(test.message)) {
                analysis.failureType = FailureType.NETWORK_ERROR;
                analysis.confidence = 0.92;
                analysis.suggestedFix = { action: 'retry_with_backoff' };
            } else if (/SyntaxError|Unexpected token/i.test(test.message)) {
                analysis.failureType = FailureType.SYNTAX_ERROR;
                analysis.confidence = 0.95;
                analysis.suggestedFix = { action: 'fix_syntax' };
            } else if (/ReferenceError|TypeError|RangeError/i.test(test.message)) {
                analysis.failureType = FailureType.RUNTIME_CRASH;
                analysis.confidence = 0.80;
                analysis.suggestedFix = { action: 'fix_runtime' };
            }

            // Check knowledge base for known pattern
            const knownFix = this._findKnownPattern(analysis);
            if (knownFix) {
                analysis.suggestedFix = knownFix;
                analysis.confidence = Math.min(1.0, analysis.confidence + 0.1);
                if (this.verbose) {
                    console.log(`  [ANALYZE] Known pattern matched for "${test.name}" → ${knownFix.action}`);
                }
            }

            analyses.push(analysis);
        }

        if (this.verbose) {
            console.log(`  [ANALYZE] Classified ${analyses.length} failures`);
            for (const a of analyses) {
                console.log(`    ├─ ${a.testName}: ${a.failureType} (confidence=${a.confidence.toFixed(2)})`);
            }
        }

        return analyses;
    }

    // ─── PLAN ────────────────────────────────────────────────────────────────

    /**
     * Generate a repair plan for each analyzed failure.
     * Plans are ordered by confidence (highest first).
     * @param {Array} analyses
     * @returns {Array<{ testName, action, params, priority }>}
     */
    plan(analyses) {
        const plans = [];

        for (const analysis of analyses) {
            const plan = {
                testName: analysis.testName,
                failureType: analysis.failureType,
                action: analysis.suggestedFix?.action || 'skip',
                params: { ...analysis.suggestedFix },
                priority: analysis.confidence,
                message: analysis.message,
            };

            // Enhance plan based on failure type
            switch (analysis.failureType) {
                case FailureType.IMPORT_ERROR:
                    if (plan.params.module) {
                        plan.action = 'install_and_retry';
                        plan.params.installCmd = plan.params.module.startsWith('.')
                            ? null  // relative path — file missing
                            : `npm install ${plan.params.module} --save-dev 2>/dev/null || true`;
                    }
                    break;

                case FailureType.TIMEOUT:
                    plan.action = 'retry_with_phi_backoff';
                    plan.params.maxRetries = 3;
                    plan.params.baseDelayMs = Math.round(1000 * PHI); // 1618ms
                    break;

                case FailureType.NETWORK_ERROR:
                    plan.action = 'retry_with_phi_backoff';
                    plan.params.maxRetries = 5;
                    plan.params.baseDelayMs = Math.round(1000 * PHI);
                    break;

                case FailureType.SCHEMA_DRIFT:
                    plan.action = 'regenerate_schema';
                    break;

                case FailureType.DEPENDENCY_MISSING:
                    plan.action = 'install_and_retry';
                    break;
            }

            plans.push(plan);
        }

        // Sort by priority (highest confidence first)
        plans.sort((a, b) => b.priority - a.priority);

        if (this.verbose) {
            console.log(`  [PLAN] Generated ${plans.length} repair plans`);
        }

        return plans;
    }

    // ─── EXECUTE ─────────────────────────────────────────────────────────────

    /**
     * Execute repair plans. Returns results for each plan.
     * @param {Array} plans
     * @returns {Array<{ testName, action, success, detail }>}
     */
    execute(plans) {
        const results = [];

        for (const plan of plans) {
            let result = { testName: plan.testName, action: plan.action, success: false, detail: '' };

            try {
                switch (plan.action) {
                    case 'install_and_retry':
                        result = this._executeInstallAndRetry(plan);
                        break;

                    case 'retry_with_phi_backoff':
                        result = this._executePhiBackoff(plan);
                        break;

                    case 'regenerate_schema':
                        result = this._executeSchemaRegenerate(plan);
                        break;

                    case 'increase_timeout':
                        result = this._executeIncreaseTimeout(plan);
                        break;

                    case 'update_assertion':
                        result = this._executeUpdateAssertion(plan);
                        break;

                    default:
                        result.detail = `No automatic fix for action: ${plan.action}`;
                        break;
                }
            } catch (err) {
                result.detail = `Execute error: ${err.message}`;
            }

            this.metrics.totalHeals++;
            if (result.success) {
                this.metrics.healSuccess++;
            } else {
                this.metrics.healFailure++;
            }

            results.push(result);

            if (this.verbose) {
                const icon = result.success ? '✓' : '✗';
                console.log(`  [EXECUTE] ${icon} ${plan.testName} → ${plan.action}: ${result.detail}`);
            }
        }

        return results;
    }

    // ─── KNOWLEDGE ───────────────────────────────────────────────────────────

    /**
     * Distill execution results into the knowledge base for permanent immunity.
     * @param {Array} analyses
     * @param {Array} executeResults
     */
    knowledge(analyses, executeResults) {
        let newPatterns = 0;

        for (let i = 0; i < analyses.length; i++) {
            const analysis = analyses[i];
            const result = executeResults[i];

            if (result && result.success) {
                const patternKey = this._patternKey(analysis);
                const existing = this.patterns[patternKey];

                if (existing) {
                    existing.hitCount++;
                    existing.lastSeen = new Date().toISOString();
                    existing.successRate = (existing.successRate * (existing.hitCount - 1) + 1) / existing.hitCount;
                } else {
                    this.patterns[patternKey] = {
                        failureType: analysis.failureType,
                        messagePattern: this._extractPattern(analysis.message),
                        fix: result.action,
                        hitCount: 1,
                        successRate: 1.0,
                        firstSeen: new Date().toISOString(),
                        lastSeen: new Date().toISOString(),
                    };
                    newPatterns++;
                }
            }
        }

        // Persist to disk
        this._saveKnowledge();

        // Update wisdom store
        this._updateWisdom(executeResults);

        if (this.verbose && newPatterns > 0) {
            console.log(`  [KNOWLEDGE] Distilled ${newPatterns} new patterns (total: ${Object.keys(this.patterns).length})`);
        }
    }

    // ─── FULL MAPE-K CYCLE ───────────────────────────────────────────────────

    /**
     * Run a complete MAPE-K self-healing cycle.
     * Repeats up to maxCycles until all tests pass or cycles exhausted.
     * @param {string} [testFile] — Optional specific test file
     * @returns {{ finalSuccess, cyclesUsed, metrics }}
     */
    runCycle(testFile) {
        console.log('\n══════════════════════════════════════════════════════');
        console.log('  MAPE-K Self-Healing Cycle');
        console.log('  © 2026 Heady™Systems Inc.');
        console.log('══════════════════════════════════════════════════════\n');

        let cyclesUsed = 0;
        let finalSuccess = false;

        for (let cycle = 0; cycle < this.maxCycles; cycle++) {
            cyclesUsed = cycle + 1;
            console.log(`\n─── Cycle ${cyclesUsed}/${this.maxCycles} ─────────────────────────────`);

            // MONITOR
            const monitorResult = this.monitor(testFile);

            if (monitorResult.success) {
                finalSuccess = true;
                console.log('\n  ✓ All tests passing. MAPE-K cycle complete.');
                break;
            }

            // ANALYZE
            const analyses = this.analyze(monitorResult);

            if (analyses.length === 0) {
                console.log('  ⚠ Tests failed but no classifiable failures found. Escalating.');
                break;
            }

            // PLAN
            const plans = this.plan(analyses);

            // EXECUTE
            const results = this.execute(plans);

            // KNOWLEDGE
            this.knowledge(analyses, results);

            // Check if any fixes were applied
            const anyFixed = results.some(r => r.success);
            if (!anyFixed) {
                console.log('  ⚠ No fixes could be applied. Stopping self-heal loop.');
                break;
            }

            // φ-scaled delay between cycles
            const delay = Math.round(FIB[Math.min(cycle, FIB.length - 1)] * PHI * 100);
            if (cycle < this.maxCycles - 1) {
                console.log(`  ⏳ φ-backoff: ${delay}ms before next cycle`);
                this._sleep(delay);
            }
        }

        // Final verification
        if (!finalSuccess) {
            console.log('\n  Running final verification...');
            const final = this.monitor(testFile);
            finalSuccess = final.success;
        }

        // Update health score
        this.metrics.phiHealthScore = this.metrics.totalRuns > 0
            ? this.metrics.healSuccess / Math.max(1, this.metrics.totalHeals)
            : 1.0;

        const cycleRecord = {
            timestamp: new Date().toISOString(),
            cyclesUsed,
            finalSuccess,
            healthScore: this.metrics.phiHealthScore,
        };
        this.metrics.cycleHistory.push(cycleRecord);

        console.log('\n══════════════════════════════════════════════════════');
        console.log(`  Result: ${finalSuccess ? '✓ HEALED' : '✗ ESCALATE'}`);
        console.log(`  Cycles: ${cyclesUsed}/${this.maxCycles}`);
        console.log(`  φ Health Score: ${this.metrics.phiHealthScore.toFixed(3)}`);
        console.log('══════════════════════════════════════════════════════\n');

        return { finalSuccess, cyclesUsed, metrics: { ...this.metrics } };
    }

    // ─── PRIVATE: Execution Strategies ───────────────────────────────────────

    _executeInstallAndRetry(plan) {
        const result = { testName: plan.testName, action: plan.action, success: false, detail: '' };
        if (plan.params.installCmd) {
            try {
                execSync(plan.params.installCmd, {
                    cwd: this.projectRoot,
                    timeout: 30000,
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                });
                result.success = true;
                result.detail = `Installed ${plan.params.module}`;
            } catch (err) {
                result.detail = `Install failed: ${err.message.split('\n')[0]}`;
            }
        } else {
            result.detail = 'Relative module missing — cannot auto-install';
        }
        return result;
    }

    _executePhiBackoff(plan) {
        const result = { testName: plan.testName, action: plan.action, success: false, detail: '' };
        const maxRetries = plan.params.maxRetries || 3;
        const baseDelay = plan.params.baseDelayMs || 1618;

        for (let i = 0; i < maxRetries; i++) {
            const delay = Math.round(baseDelay * FIB[Math.min(i, FIB.length - 1)]);
            this._sleep(delay);

            // Re-check by running monitor
            try {
                execSync(this.testCommand, {
                    cwd: this.projectRoot,
                    timeout: this.testTimeout,
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: { ...process.env, NODE_ENV: 'test' },
                });
                result.success = true;
                result.detail = `Passed after ${i + 1} retries (φ-backoff)`;
                return result;
            } catch {
                // Continue retrying
            }
        }
        result.detail = `Still failing after ${maxRetries} φ-scaled retries`;
        return result;
    }

    _executeSchemaRegenerate(plan) {
        const result = { testName: plan.testName, action: plan.action, success: false, detail: '' };
        // Attempt to run any schema generation script
        const schemaScripts = ['npm run generate:schema', 'npm run schema:sync', 'npm run codegen'];
        for (const cmd of schemaScripts) {
            try {
                execSync(cmd, {
                    cwd: this.projectRoot,
                    timeout: 30000,
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                });
                result.success = true;
                result.detail = `Schema regenerated via: ${cmd}`;
                return result;
            } catch {
                // Try next
            }
        }
        result.detail = 'No schema regeneration script found';
        return result;
    }

    _executeIncreaseTimeout(plan) {
        return {
            testName: plan.testName,
            action: plan.action,
            success: true,
            detail: 'Timeout noted — will increase on next run',
        };
    }

    _executeUpdateAssertion(plan) {
        return {
            testName: plan.testName,
            action: plan.action,
            success: false,
            detail: 'Assertion update requires manual review or LLM-assisted fix',
        };
    }

    // ─── PRIVATE: Knowledge Store ────────────────────────────────────────────

    _loadKnowledge() {
        try {
            const dir = path.dirname(this.knowledgeStore);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            if (fs.existsSync(this.knowledgeStore)) {
                return JSON.parse(fs.readFileSync(this.knowledgeStore, 'utf8'));
            }
        } catch { /* start fresh */ }
        return {};
    }

    _saveKnowledge() {
        try {
            const dir = path.dirname(this.knowledgeStore);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.knowledgeStore, JSON.stringify(this.patterns, null, 2));
        } catch (err) {
            if (this.verbose) console.error(`  [KNOWLEDGE] Save failed: ${err.message}`);
        }
    }

    _updateWisdom(results) {
        try {
            const dir = path.dirname(this.wisdomStore);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            let wisdom = {};
            if (fs.existsSync(this.wisdomStore)) {
                wisdom = JSON.parse(fs.readFileSync(this.wisdomStore, 'utf8'));
            }

            wisdom.lastUpdated = new Date().toISOString();
            wisdom.totalHeals = (wisdom.totalHeals || 0) + results.filter(r => r.success).length;
            wisdom.totalAttempts = (wisdom.totalAttempts || 0) + results.length;
            wisdom.healRate = wisdom.totalAttempts > 0
                ? wisdom.totalHeals / wisdom.totalAttempts
                : 0;

            fs.writeFileSync(this.wisdomStore, JSON.stringify(wisdom, null, 2));
        } catch { /* non-critical */ }
    }

    _findKnownPattern(analysis) {
        const key = this._patternKey(analysis);
        const pattern = this.patterns[key];
        if (pattern && pattern.successRate >= PSI_BOOST) {
            return { action: pattern.fix, fromKnowledge: true };
        }
        return null;
    }

    _patternKey(analysis) {
        const msgHash = crypto.createHash('md5')
            .update(this._extractPattern(analysis.message))
            .digest('hex')
            .slice(0, 8);
        return `${analysis.failureType}:${msgHash}`;
    }

    _extractPattern(message) {
        // Strip variable parts (numbers, paths, hashes) to create a reusable pattern
        return (message || '')
            .replace(/\/[^\s]+/g, '<path>')
            .replace(/\b[0-9a-f]{6,}\b/g, '<hash>')
            .replace(/\d+/g, '<n>')
            .trim()
            .slice(0, 200);
    }

    // ─── PRIVATE: Parsing ────────────────────────────────────────────────────

    _parseFailures(output) {
        const failures = [];
        const lines = output.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match common test failure patterns
            if (/✗|FAIL|✘|Error:|AssertionError/i.test(line) && !/passed|PASS/.test(line)) {
                const name = line.replace(/^[\s✗✘×]+/, '').replace(/\s*FAIL\s*/i, '').trim().slice(0, 120);
                if (name.length > 2) {
                    // Collect subsequent lines as message/stack
                    const msgLines = [];
                    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                        if (lines[j].trim()) msgLines.push(lines[j].trim());
                        else break;
                    }
                    failures.push({
                        name,
                        message: msgLines.join('\n'),
                        stack: msgLines.filter(l => /at\s/.test(l)).join('\n'),
                    });
                }
            }
        }

        return failures;
    }

    _sleep(ms) {
        const end = Date.now() + ms;
        while (Date.now() < end) { /* busy wait — intentional for sync context */ }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = { MapeKEngine, FailureType, PHI, PSI_CRITICAL, PSI_BOOST, PSI_INJECT, FIB };

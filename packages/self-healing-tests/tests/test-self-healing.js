#!/usr/bin/env node
/**
 * © 2026 Heady™Systems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * ─── Self-Healing Framework Tests ────────────────────────────────────────────
 *
 * Validates the MAPE-K engine, chaos injector, and self-healing runner.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { MapeKEngine, FailureType, PHI, PSI_CRITICAL, PSI_BOOST, FIB } = require('../src/mape-k-engine');
const { ChaosInjector, ChaosScenario, FIB_SEQUENCE } = require('../src/chaos-injector');
const path = require('path');
const fs = require('fs');

// ─── Test Harness ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const _queue = [];

function test(name, fn) {
    _queue.push(async () => {
        try {
            await fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ ${name}: ${err.message}`);
            failed++;
        }
    });
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertClose(a, b, tolerance, msg) {
    if (Math.abs(a - b) > tolerance) {
        throw new Error(msg || `Expected ${a} ≈ ${b} (±${tolerance})`);
    }
}

// ─── MAPE-K Engine Tests ─────────────────────────────────────────────────────

test('PHI constant is golden ratio', () => {
    assertClose(PHI, 1.6180339887, 0.0001, 'PHI should be golden ratio');
});

test('PSI thresholds are correct CSL gates', () => {
    assertClose(PSI_CRITICAL, 0.382, 0.001);
    assertClose(PSI_BOOST, 0.618, 0.001);
});

test('FIB sequence is correct', () => {
    assert(FIB[0] === 1 && FIB[1] === 1 && FIB[2] === 2 && FIB[3] === 3);
    assert(FIB[4] === 5 && FIB[5] === 8 && FIB[6] === 13 && FIB[7] === 21);
});

test('MapeKEngine instantiates with defaults', () => {
    const engine = new MapeKEngine({ verbose: false });
    assert(engine.maxCycles === 5);
    assert(engine.testCommand === 'npm test');
    assert(engine.metrics.totalRuns === 0);
    assert(engine.metrics.phiHealthScore === 1.0);
});

test('MapeKEngine instantiates with custom options', () => {
    const engine = new MapeKEngine({
        projectRoot: '/tmp',
        testCommand: 'echo ok',
        maxCycles: 3,
        verbose: false,
    });
    assert(engine.maxCycles === 3);
    assert(engine.testCommand === 'echo ok');
});

test('MapeKEngine._parseFailures extracts test failures', () => {
    const engine = new MapeKEngine({ verbose: false });
    const output = `
  ✓ test passes
  ✗ test fails: AssertionError: expected 1 to equal 2
    at Context.<anonymous> (test.js:10:5)
  ✓ another passing test
    `;
    const failures = engine._parseFailures(output);
    assert(failures.length >= 1, `Expected at least 1 failure, got ${failures.length}`);
});

test('MapeKEngine._extractPattern strips variable parts', () => {
    const engine = new MapeKEngine({ verbose: false });
    const pattern = engine._extractPattern('Cannot find module /home/user/foo/bar.js at line 42');
    assert(pattern.includes('<path>'), 'Should replace paths');
    assert(pattern.includes('<n>'), 'Should replace numbers');
});

test('MapeKEngine.analyze classifies import errors', () => {
    const engine = new MapeKEngine({ verbose: false });
    const analyses = engine.analyze({
        failedTests: [{
            name: 'import test',
            message: "Cannot find module '@heady/missing-package'",
            stack: '',
        }],
        stdout: '',
        stderr: '',
    });
    assert(analyses.length === 1);
    assert(analyses[0].failureType === FailureType.IMPORT_ERROR);
    assert(analyses[0].confidence >= 0.9);
});

test('MapeKEngine.analyze classifies assertion failures', () => {
    const engine = new MapeKEngine({ verbose: false });
    const analyses = engine.analyze({
        failedTests: [{
            name: 'assertion test',
            message: 'AssertionError: Expected true but got false',
            stack: '',
        }],
        stdout: '',
        stderr: '',
    });
    assert(analyses[0].failureType === FailureType.ASSERTION_FAIL);
});

test('MapeKEngine.analyze classifies timeout errors', () => {
    const engine = new MapeKEngine({ verbose: false });
    const analyses = engine.analyze({
        failedTests: [{
            name: 'timeout test',
            message: 'Error: ETIMEDOUT connecting to service',
            stack: '',
        }],
        stdout: '',
        stderr: '',
    });
    assert(analyses[0].failureType === FailureType.TIMEOUT);
});

test('MapeKEngine.analyze classifies schema drift', () => {
    const engine = new MapeKEngine({ verbose: false });
    const analyses = engine.analyze({
        failedTests: [{
            name: 'schema test',
            message: 'Zod error: schema mismatch on field "name"',
            stack: '',
        }],
        stdout: '',
        stderr: '',
    });
    assert(analyses[0].failureType === FailureType.SCHEMA_DRIFT);
});

test('MapeKEngine.analyze classifies network errors', () => {
    const engine = new MapeKEngine({ verbose: false });
    const analyses = engine.analyze({
        failedTests: [{
            name: 'network test',
            message: 'ECONNREFUSED 127.0.0.1:5432',
            stack: '',
        }],
        stdout: '',
        stderr: '',
    });
    assert(analyses[0].failureType === FailureType.NETWORK_ERROR);
});

test('MapeKEngine.plan generates repair plans sorted by confidence', () => {
    const engine = new MapeKEngine({ verbose: false });
    const plans = engine.plan([
        { testName: 'a', failureType: FailureType.UNKNOWN, confidence: 0.3, message: '', suggestedFix: null },
        { testName: 'b', failureType: FailureType.IMPORT_ERROR, confidence: 0.95, message: '', suggestedFix: { action: 'install_module', module: 'foo' } },
    ]);
    assert(plans.length === 2);
    assert(plans[0].testName === 'b', 'Higher confidence should come first');
    assert(plans[0].priority > plans[1].priority);
});

test('MapeKEngine.plan creates phi-backoff for timeouts', () => {
    const engine = new MapeKEngine({ verbose: false });
    const plans = engine.plan([{
        testName: 'timeout',
        failureType: FailureType.TIMEOUT,
        confidence: 0.9,
        message: '',
        suggestedFix: { action: 'increase_timeout' },
    }]);
    assert(plans[0].action === 'retry_with_phi_backoff');
    assert(plans[0].params.baseDelayMs === 1618);
});

test('MapeKEngine knowledge store round-trip', () => {
    const tmpDir = path.join('/tmp', `heady-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    const storePath = path.join(tmpDir, 'pattern_store.json');

    const engine = new MapeKEngine({
        knowledgeStore: storePath,
        wisdomStore: path.join(tmpDir, 'wisdom.json'),
        verbose: false,
    });

    // Simulate knowledge distillation
    engine.knowledge(
        [{ failureType: 'test_type', message: 'test error', suggestedFix: { action: 'fix' } }],
        [{ success: true, action: 'fix' }]
    );

    assert(fs.existsSync(storePath), 'Pattern store should be persisted');
    const stored = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    assert(Object.keys(stored).length >= 1, 'Should have at least 1 pattern');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('MapeKEngine.monitor runs a passing test command', () => {
    const engine = new MapeKEngine({
        projectRoot: '/tmp',
        testCommand: 'echo "1 passed"',
        verbose: false,
    });
    const result = engine.monitor();
    assert(result.success === true, 'echo should succeed');
    assert(result.exitCode === 0);
    assert(result.durationMs >= 0);
});

test('MapeKEngine.monitor captures failing test command', () => {
    const engine = new MapeKEngine({
        projectRoot: '/tmp',
        testCommand: 'exit 1',
        verbose: false,
    });
    const result = engine.monitor();
    assert(result.success === false, 'exit 1 should fail');
    assert(result.exitCode === 1);
});

// ─── Chaos Injector Tests ────────────────────────────────────────────────────

test('ChaosInjector instantiates', () => {
    const chaos = new ChaosInjector({ verbose: false });
    assert(chaos.isRunning === false);
    assert(chaos.results.length === 0);
});

test('ChaosInjector.buildSchedule creates Fibonacci-timed schedule', () => {
    const chaos = new ChaosInjector({ verbose: false });
    const schedule = chaos.buildSchedule({
        baseMs: 1000,
        scenarios: [ChaosScenario.REDIS_KILL, ChaosScenario.LLM_PRIMARY_KILL, ChaosScenario.DATABASE_KILL],
    });
    assert(schedule.length === 3);
    // Verify Fibonacci timing: each trigger should use FIB[i+2] × φ × base
    for (let i = 0; i < schedule.length; i++) {
        assert(schedule[i].triggerAtMs > 0, `Schedule ${i} should have positive trigger time`);
    }
    // Schedule should be sorted by time
    for (let i = 1; i < schedule.length; i++) {
        assert(schedule[i].triggerAtMs >= schedule[i - 1].triggerAtMs, 'Schedule should be sorted by time');
    }
});

test('ChaosInjector.buildSchedule uses φ multiplier', () => {
    const chaos = new ChaosInjector({ verbose: false });
    const schedule = chaos.buildSchedule({
        baseMs: 1000,
        scenarios: [ChaosScenario.REDIS_KILL],
    });
    // FIB[2] = 2, expected = 2 × 1.618 × 1000 = 3236
    const expected = Math.round(FIB_SEQUENCE[2] * 1.6180339887 * 1000);
    assertClose(schedule[0].triggerAtMs, expected, 2, `Expected ${expected}ms, got ${schedule[0].triggerAtMs}ms`);
});

test('ChaosInjector.executeSchedule recovers with default handlers', async () => {
    const chaos = new ChaosInjector({ verbose: false });
    chaos.buildSchedule({
        baseMs: 100,
        scenarios: [ChaosScenario.REDIS_KILL, ChaosScenario.DATABASE_KILL],
    });
    const result = await chaos.executeSchedule({ recoveryWindowMs: 100 });
    assert(result.totalScenarios === 2);
    assert(result.passed === 2, 'Default handlers should auto-recover');
    assert(result.resilienceScore === 1.0);
});

test('ChaosInjector.executeSchedule with custom recovery handler', async () => {
    const chaos = new ChaosInjector({ verbose: false });
    chaos.registerRecovery('redis', async () => true);
    chaos.buildSchedule({
        baseMs: 100,
        scenarios: [ChaosScenario.REDIS_KILL],
    });
    const result = await chaos.executeSchedule({ recoveryWindowMs: 100 });
    assert(result.passed === 1);
});

test('ChaosInjector.executeSchedule with failing recovery', async () => {
    const chaos = new ChaosInjector({ verbose: false });
    chaos.registerRecovery('database', async () => false);
    chaos.buildSchedule({
        baseMs: 100,
        scenarios: [ChaosScenario.DATABASE_KILL],
    });
    const result = await chaos.executeSchedule({ recoveryWindowMs: 100 });
    assert(result.failed === 1);
    assert(result.resilienceScore === 0);
});

test('ChaosInjector.generateFuzzPayloads generates correct count', () => {
    const chaos = new ChaosInjector({ verbose: false });
    const payloads = chaos.generateFuzzPayloads(50);
    assert(payloads.length === 50, `Expected 50 payloads, got ${payloads.length}`);
});

test('ChaosInjector.generateFuzzPayloads includes boundary types', () => {
    const chaos = new ChaosInjector({ verbose: false });
    const payloads = chaos.generateFuzzPayloads(100);
    const types = new Set(payloads.map(p => p.type));
    assert(types.has('null_field'), 'Should include null boundary');
    assert(types.has('max_int'), 'Should include numeric boundary');
    assert(types.has('long_string'), 'Should include string boundary');
    assert(types.has('sql_inject'), 'Should include security boundary');
    assert(types.has('nested_deep'), 'Should include structural boundary');
});

test('ChaosInjector.generateFuzzPayloads are mostly serializable', () => {
    const chaos = new ChaosInjector({ verbose: false });
    const payloads = chaos.generateFuzzPayloads(100);
    let serializable = 0;
    for (const p of payloads) {
        try {
            JSON.stringify(p.payload);
            serializable++;
        } catch { /* expected for some edge cases */ }
    }
    // At least 80% should be serializable
    assert(serializable >= 80, `Expected ≥80 serializable, got ${serializable}`);
});

test('ChaosScenario enum has all expected values', () => {
    assert(ChaosScenario.DATABASE_KILL === 'database_kill');
    assert(ChaosScenario.LLM_PRIMARY_KILL === 'llm_primary_kill');
    assert(ChaosScenario.REDIS_KILL === 'redis_kill');
    assert(ChaosScenario.DEPLOY_REGRESSION === 'deploy_regression');
    assert(ChaosScenario.CASCADE_FAILURE === 'cascade_failure');
});

test('ChaosInjector emits scenario_complete events', async () => {
    const chaos = new ChaosInjector({ verbose: false });
    let eventCount = 0;
    chaos.on('scenario_complete', () => eventCount++);
    chaos.buildSchedule({
        baseMs: 100,
        scenarios: [ChaosScenario.REDIS_KILL, ChaosScenario.DATABASE_KILL],
    });
    await chaos.executeSchedule({ recoveryWindowMs: 100 });
    assert(eventCount === 2, `Expected 2 events, got ${eventCount}`);
});

// ─── FailureType Tests ───────────────────────────────────────────────────────

test('FailureType enum covers all expected types', () => {
    assert(FailureType.IMPORT_ERROR === 'import_error');
    assert(FailureType.ASSERTION_FAIL === 'assertion_fail');
    assert(FailureType.TIMEOUT === 'timeout');
    assert(FailureType.SCHEMA_DRIFT === 'schema_drift');
    assert(FailureType.NETWORK_ERROR === 'network_error');
    assert(FailureType.DEPENDENCY_MISSING === 'dependency_missing');
    assert(FailureType.SYNTAX_ERROR === 'syntax_error');
    assert(FailureType.RUNTIME_CRASH === 'runtime_crash');
    assert(FailureType.UNKNOWN === 'unknown');
});

// ─── Run All ─────────────────────────────────────────────────────────────────

async function runAll() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Heady™ Self-Healing Framework Test Suite');
    console.log('  © 2026 Heady™Systems Inc.');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const fn of _queue) await fn();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
}

runAll();

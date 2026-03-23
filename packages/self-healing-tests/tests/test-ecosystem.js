#!/usr/bin/env node
/**
 * © 2026 Heady™Systems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * ─── Ecosystem Runner & Health Tests ────────────────────────────────────────
 *
 * Validates the EcosystemRunner and EcosystemHealth modules including
 * scanning, health scoring, φ-weighted aggregation, tier classification,
 * and dashboard generation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { EcosystemRunner } = require('../src/ecosystem-runner');
const { EcosystemHealth, HEALTH_TIERS, classifyTier, phiWeightedMean, PHI, PSI, PSI2 } = require('../src/ecosystem-health');
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

// ─── EcosystemRunner Tests ──────────────────────────────────────────────────

test('EcosystemRunner instantiates with defaults', () => {
    const runner = new EcosystemRunner({ quiet: true });
    assert(runner.reposDir === '/home/user', `Expected reposDir "/home/user", got "${runner.reposDir}"`);
    assert(runner.maxConcurrent === 8, `Expected maxConcurrent 8, got ${runner.maxConcurrent}`);
    assert(runner.testTimeout === 60000, `Expected testTimeout 60000, got ${runner.testTimeout}`);
});

test('EcosystemRunner instantiates with custom options', () => {
    const runner = new EcosystemRunner({
        reposDir: '/tmp/test-repos',
        maxConcurrent: 4,
        testTimeout: 30000,
        maxHealCycles: 3,
        quiet: true,
    });
    assert(runner.reposDir === '/tmp/test-repos', `Expected reposDir "/tmp/test-repos", got "${runner.reposDir}"`);
    assert(runner.maxConcurrent === 4, `Expected maxConcurrent 4, got ${runner.maxConcurrent}`);
    assert(runner.testTimeout === 30000, `Expected testTimeout 30000, got ${runner.testTimeout}`);
    assert(runner.maxHealCycles === 3, `Expected maxHealCycles 3, got ${runner.maxHealCycles}`);
});

test('scanRepos() returns array of repo objects', async () => {
    const tmpDir = path.join('/tmp', `heady-eco-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    // Create a couple of fake repo directories
    fs.mkdirSync(path.join(tmpDir, 'repo-alpha'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'repo-beta'), { recursive: true });

    const runner = new EcosystemRunner({ reposDir: tmpDir, quiet: true });
    const repos = await runner.scanRepos();

    assert(Array.isArray(repos), 'scanRepos should return an array');
    assert(repos.length === 2, `Expected 2 repos, got ${repos.length}`);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Each repo object has: name, path, hasTests, testCommand, hasCI', async () => {
    const tmpDir = path.join('/tmp', `heady-eco-test-${Date.now()}`);
    fs.mkdirSync(path.join(tmpDir, 'my-repo'), { recursive: true });

    const runner = new EcosystemRunner({ reposDir: tmpDir, quiet: true });
    const repos = await runner.scanRepos();

    assert(repos.length === 1, `Expected 1 repo, got ${repos.length}`);
    const repo = repos[0];
    assert(repo.name === 'my-repo', `Expected name "my-repo", got "${repo.name}"`);
    assert(repo.path === path.join(tmpDir, 'my-repo'), `Unexpected path "${repo.path}"`);
    assert(typeof repo.hasTests === 'boolean', 'hasTests should be boolean');
    assert('testCommand' in repo, 'repo should have testCommand property');
    assert(typeof repo.hasCI === 'boolean', 'hasCI should be boolean');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('scanRepos() detects repos with package.json test scripts', async () => {
    const tmpDir = path.join('/tmp', `heady-eco-test-${Date.now()}`);
    const repoDir = path.join(tmpDir, 'test-repo');
    fs.mkdirSync(repoDir, { recursive: true });

    // Write a package.json with a real test script
    fs.writeFileSync(path.join(repoDir, 'package.json'), JSON.stringify({
        name: 'test-repo',
        scripts: { test: 'node test.js' },
    }));

    const runner = new EcosystemRunner({ reposDir: tmpDir, quiet: true });
    const repos = await runner.scanRepos();

    assert(repos.length === 1, `Expected 1 repo, got ${repos.length}`);
    assert(repos[0].hasTests === true, 'Should detect test script in package.json');
    assert(repos[0].testCommand === 'npm test', `Expected "npm test", got "${repos[0].testCommand}"`);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('computeHealthScore with all-passing repos returns 1.0', () => {
    const runner = new EcosystemRunner({ quiet: true });
    const results = [
        { name: 'repo-a', success: true, healed: false, cyclesUsed: 0, durationMs: 100, error: null },
        { name: 'repo-b', success: true, healed: false, cyclesUsed: 0, durationMs: 200, error: null },
        { name: 'repo-c', success: true, healed: false, cyclesUsed: 0, durationMs: 150, error: null },
    ];
    const health = runner.computeHealthScore(results);
    assertClose(health.score, 1.0, 0.001, `Expected score 1.0, got ${health.score}`);
    assert(health.passed === 3, `Expected 3 passed, got ${health.passed}`);
    assert(health.failed === 0, `Expected 0 failed, got ${health.failed}`);
});

test('computeHealthScore with mixed results returns between 0 and 1', () => {
    const runner = new EcosystemRunner({ quiet: true });
    const results = [
        { name: 'repo-a', success: true, healed: false, cyclesUsed: 0, durationMs: 100, error: null },
        { name: 'repo-b', success: false, healed: false, cyclesUsed: 5, durationMs: 500, error: 'test failed' },
        { name: 'repo-c', success: true, healed: true, cyclesUsed: 2, durationMs: 300, error: null },
    ];
    const health = runner.computeHealthScore(results);
    assert(health.score > 0, `Expected score > 0, got ${health.score}`);
    assert(health.score < 1, `Expected score < 1, got ${health.score}`);
    assert(health.passed === 2, `Expected 2 passed, got ${health.passed}`);
    assert(health.failed === 1, `Expected 1 failed, got ${health.failed}`);
    assert(health.healed === 1, `Expected 1 healed, got ${health.healed}`);
});

test('computeHealthScore weights test-having repos PHI× more', () => {
    const runner = new EcosystemRunner({ quiet: true });

    // All repos with tests, all passing
    const withTests = [
        { name: 'repo-a', success: true, healed: false, cyclesUsed: 0, durationMs: 100, error: null },
    ];
    const healthWithTests = runner.computeHealthScore(withTests);

    // Mix of repos with and without tests
    const mixed = [
        { name: 'repo-a', success: true, healed: false, cyclesUsed: 0, durationMs: 100, error: null },
        { name: 'repo-b', success: true, healed: false, cyclesUsed: 0, durationMs: 0, error: 'no_tests' },
    ];
    const healthMixed = runner.computeHealthScore(mixed);

    // Both should be 1.0 when all passing, but the weight distribution differs
    // Verify that repos with tests get PHI weight vs 1.0 weight for no-tests
    assert(healthWithTests.reposWithTests === 1, 'Should have 1 repo with tests');
    assert(healthMixed.noTests === 1, 'Should have 1 repo without tests');

    // The PHI weighting is internally applied: test-having repos use PHI as weight,
    // no-test repos use 1.0. Verify by checking a failing test-having repo has more
    // impact than a failing no-test repo would.
    const failingWithTest = [
        { name: 'repo-a', success: false, healed: false, cyclesUsed: 5, durationMs: 500, error: 'fail' },
        { name: 'repo-b', success: true, healed: false, cyclesUsed: 0, durationMs: 0, error: 'no_tests' },
    ];
    const healthFailing = runner.computeHealthScore(failingWithTest);
    // Score = (PHI * 0.382 + 1.0 * 1.0) / (PHI + 1.0) = (0.618 + 1.0) / 2.618 ≈ 0.618
    // The failing test-having repo drags down the score via PHI-weighting
    assert(healthFailing.score < 1.0, `PHI-weighted failing repo should lower score, got ${healthFailing.score}`);
    assertClose(healthFailing.score, (1.6180339887 * 0.382 + 1.0) / (1.6180339887 + 1.0), 0.01,
        `Expected φ-weighted score calculation to match`);
});

test('generateReport includes required fields (timestamp, ecosystem, repos)', () => {
    const runner = new EcosystemRunner({ quiet: true });
    const results = [
        { name: 'repo-a', success: true, healed: false, cyclesUsed: 0, durationMs: 100, error: null },
        { name: 'repo-b', success: false, healed: false, cyclesUsed: 3, durationMs: 400, error: 'assertion failed' },
    ];
    const report = runner.generateReport(results);

    assert(typeof report.timestamp === 'string', 'Report should have timestamp string');
    assert(typeof report.ecosystemStatus === 'string', 'Report should have ecosystemStatus');
    assert(typeof report.healthScore === 'object', 'Report should have healthScore object');
    assert(typeof report.summary === 'object', 'Report should have summary object');
    assert(typeof report.repos === 'object', 'Report should have repos object');
    assert(Array.isArray(report.repos.passing), 'repos.passing should be an array');
    assert(Array.isArray(report.repos.healed), 'repos.healed should be an array');
    assert(Array.isArray(report.repos.failed), 'repos.failed should be an array');
    assert(Array.isArray(report.repos.noTests), 'repos.noTests should be an array');
    assert(typeof report.timing === 'object', 'Report should have timing object');
    assert(report.summary.totalRepos === 2, `Expected totalRepos 2, got ${report.summary.totalRepos}`);
});

// ─── EcosystemHealth Tests ──────────────────────────────────────────────────

test('EcosystemHealth instantiates', () => {
    const health = new EcosystemHealth('/tmp');
    assert(health.reposDir === path.resolve('/tmp'), `Expected resolved /tmp, got "${health.reposDir}"`);
    assert(health._cache === null, 'Cache should initially be null');
});

test('HEALTH_TIERS has correct φ-based boundaries', () => {
    // OPTIMAL min = PSI + PSI² ≈ 0.618 + 0.382 = 1.0
    assertClose(HEALTH_TIERS.OPTIMAL.min, PSI + PSI2, 0.0001,
        `OPTIMAL min should be PSI+PSI2 ≈ ${PSI + PSI2}, got ${HEALTH_TIERS.OPTIMAL.min}`);

    // HEALTHY min = 1 - PSI² ≈ 0.618
    assertClose(HEALTH_TIERS.HEALTHY.min, 1 - PSI2, 0.0001,
        `HEALTHY min should be 1-PSI2 ≈ ${1 - PSI2}, got ${HEALTH_TIERS.HEALTHY.min}`);

    // DEGRADED min = PSI² ≈ 0.382
    assertClose(HEALTH_TIERS.DEGRADED.min, PSI2, 0.0001,
        `DEGRADED min should be PSI2 ≈ ${PSI2}, got ${HEALTH_TIERS.DEGRADED.min}`);

    // CRITICAL min = 0
    assert(HEALTH_TIERS.CRITICAL.min === 0, `CRITICAL min should be 0, got ${HEALTH_TIERS.CRITICAL.min}`);

    // Verify labels
    assert(HEALTH_TIERS.OPTIMAL.label === 'Optimal', 'OPTIMAL label mismatch');
    assert(HEALTH_TIERS.HEALTHY.label === 'Healthy', 'HEALTHY label mismatch');
    assert(HEALTH_TIERS.DEGRADED.label === 'Degraded', 'DEGRADED label mismatch');
    assert(HEALTH_TIERS.CRITICAL.label === 'Critical', 'CRITICAL label mismatch');
});

test('classifyTier returns correct tier for various scores', () => {
    // Perfect score → Optimal
    assert(classifyTier(1.0) === 'Optimal', `Expected "Optimal" for 1.0, got "${classifyTier(1.0)}"`);

    // Just above HEALTHY threshold → Healthy
    const healthyScore = 0.65;
    assert(classifyTier(healthyScore) === 'Healthy', `Expected "Healthy" for ${healthyScore}, got "${classifyTier(healthyScore)}"`);

    // In DEGRADED range (between PSI² and 1-PSI²)
    const degradedScore = 0.4;
    assert(classifyTier(degradedScore) === 'Degraded', `Expected "Degraded" for ${degradedScore}, got "${classifyTier(degradedScore)}"`);

    // Below PSI² → Critical
    const criticalScore = 0.1;
    assert(classifyTier(criticalScore) === 'Critical', `Expected "Critical" for ${criticalScore}, got "${classifyTier(criticalScore)}"`);

    // Zero → Critical
    assert(classifyTier(0) === 'Critical', `Expected "Critical" for 0, got "${classifyTier(0)}"`);

    // Boundary: exactly PSI² → Degraded
    assert(classifyTier(PSI2) === 'Degraded', `Expected "Degraded" for PSI2, got "${classifyTier(PSI2)}"`);
});

test('phiWeightedMean computes correct weighted averages', () => {
    // Single value → returns that value
    assertClose(phiWeightedMean([0.8]), 0.8, 0.0001, 'Single value should return itself');

    // Empty array → returns 0
    assert(phiWeightedMean([]) === 0, 'Empty array should return 0');

    // Uniform values → returns that value
    assertClose(phiWeightedMean([0.5, 0.5, 0.5]), 0.5, 0.0001, 'Uniform values should return same value');

    // First value weighted more heavily (PSI^0 = 1, PSI^1 ≈ 0.618, PSI^2 ≈ 0.382)
    // For [1.0, 0.0]: mean = (1.0 * 1.0 + 0.0 * PSI) / (1.0 + PSI) = 1.0 / (1 + PSI)
    const twoValues = phiWeightedMean([1.0, 0.0]);
    const expected = 1.0 / (1.0 + PSI);
    assertClose(twoValues, expected, 0.0001,
        `Two values [1.0, 0.0] should give ${expected}, got ${twoValues}`);

    // Verify first element has more weight than second
    const biasedHigh = phiWeightedMean([1.0, 0.0]);
    const biasedLow = phiWeightedMean([0.0, 1.0]);
    assert(biasedHigh > biasedLow,
        `First element should dominate: [1,0]=${biasedHigh} should > [0,1]=${biasedLow}`);
});

test('generateDashboard returns object with required structure', () => {
    // Create a temporary directory with a repo containing .heady/reports/
    const tmpDir = path.join('/tmp', `heady-health-test-${Date.now()}`);
    const repoDir = path.join(tmpDir, 'test-repo', '.heady', 'reports');
    fs.mkdirSync(repoDir, { recursive: true });

    // Write a sample report
    fs.writeFileSync(path.join(repoDir, 'report-001.json'), JSON.stringify({
        timestamp: new Date().toISOString(),
        totalTests: 10,
        passed: 8,
        failed: 2,
        healed: 1,
        healAttempts: 3,
    }));

    const health = new EcosystemHealth(tmpDir);
    const dashboard = health.generateDashboard();

    // Verify top-level structure
    assert(typeof dashboard._meta === 'object', 'Dashboard should have _meta');
    assert(typeof dashboard.ecosystem === 'object', 'Dashboard should have ecosystem');
    assert(typeof dashboard.repos === 'object', 'Dashboard should have repos');
    assert(Array.isArray(dashboard.leaderboard), 'Dashboard should have leaderboard array');
    assert(Array.isArray(dashboard.needsAttention), 'Dashboard should have needsAttention array');
    assert(typeof dashboard.constants === 'object', 'Dashboard should have constants');

    // Verify _meta fields
    assert(typeof dashboard._meta.generatedAt === 'string', '_meta should have generatedAt');
    assert(dashboard._meta.phi === PHI, '_meta.phi should be PHI');

    // Verify ecosystem fields
    assert(typeof dashboard.ecosystem.score === 'number', 'ecosystem should have score');
    assert(typeof dashboard.ecosystem.tier === 'string', 'ecosystem should have tier');
    assert(typeof dashboard.ecosystem.repoCount === 'number', 'ecosystem should have repoCount');
    assert(typeof dashboard.ecosystem.distribution === 'object', 'ecosystem should have distribution');

    // Verify constants
    assert(dashboard.constants.PHI === PHI, 'constants.PHI mismatch');
    assert(dashboard.constants.PSI === PSI, 'constants.PSI mismatch');
    assert(dashboard.constants.PSI2 === PSI2, 'constants.PSI2 mismatch');

    // Verify the test-repo appears in repos
    assert('test-repo' in dashboard.repos, 'test-repo should appear in repos');
    assert(typeof dashboard.repos['test-repo'].health === 'object', 'repo should have health');
    assert(typeof dashboard.repos['test-repo'].trend === 'object', 'repo should have trend');
    assert(typeof dashboard.repos['test-repo'].metrics === 'object', 'repo should have metrics');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── Run All ─────────────────────────────────────────────────────────────────

async function runAll() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Heady™ Ecosystem Runner & Health Test Suite');
    console.log('  © 2026 Heady™Systems Inc.');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const fn of _queue) await fn();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
}

runAll();

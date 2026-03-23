#!/usr/bin/env node
/**
 * © 2026 Heady™Systems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * ─── Ecosystem Runner — Cross-Repo Autonomous Self-Healing Test Runner ──────
 *
 * Scans all 75+ Heady repos at /home/user/, runs their tests, applies MAPE-K
 * self-healing on failures, and produces a unified ecosystem health report.
 *
 * Architecture:
 *   1. Scan   — Discover all repo directories and detect test infrastructure
 *   2. Run    — Execute tests per-repo with timeout and failure capture
 *   3. Heal   — Apply MAPE-K self-healing loop on any failures
 *   4. Report — Aggregate into φ-weighted unified health score
 *
 * Uses φ-scaled weighting throughout (PHI = 1.6180339887).
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MapeKEngine } = require('./mape-k-engine');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — Sacred Geometry & Fibonacci
// ─────────────────────────────────────────────────────────────────────────────

const PHI = 1.6180339887;
const PSI_CRITICAL = 0.382;
const PSI_BOOST = 0.618;
const FIB = [1, 1, 2, 3, 5, 8, 13, 21];

// Known directories to exclude from repo scanning
const EXCLUDED_DIRS = new Set([
    '.cache', '.local', '.config', '.npm', '.nvm', '.yarn', '.pnpm',
    '.git', '.ssh', '.gnupg', '.vscode', '.cursor', 'node_modules',
    'snap', '.dbus', '.mozilla', '.profile', '.bashrc', '.bash_history',
]);

// ─────────────────────────────────────────────────────────────────────────────
// ECOSYSTEM RUNNER
// ─────────────────────────────────────────────────────────────────────────────

class EcosystemRunner {
    /**
     * @param {Object} opts
     * @param {string} opts.reposDir       — Root directory containing repos (default /home/user)
     * @param {number} opts.maxConcurrent  — Max repos to test in a batch (default FIB[5]=8)
     * @param {number} opts.testTimeout    — Per-repo test timeout in ms (default 60000)
     * @param {number} opts.maxHealCycles  — Max MAPE-K heal cycles per repo (default 5)
     * @param {boolean} opts.quiet         — Suppress per-repo console output
     */
    constructor(opts = {}) {
        this.reposDir = opts.reposDir || '/home/user';
        this.maxConcurrent = opts.maxConcurrent || FIB[5]; // 8
        this.testTimeout = opts.testTimeout || 60000;
        this.maxHealCycles = opts.maxHealCycles || 5;
        this.quiet = opts.quiet || false;
    }

    // ─── SCAN ────────────────────────────────────────────────────────────────

    /**
     * Scan reposDir for all repository directories.
     * Detects whether each has tests, a test command, and CI configuration.
     * @returns {Array<{ name, path, hasTests, testCommand, hasCI }>}
     */
    async scanRepos() {
        const entries = fs.readdirSync(this.reposDir, { withFileTypes: true });
        const repos = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (entry.name.startsWith('.')) continue;
            if (EXCLUDED_DIRS.has(entry.name)) continue;

            const repoPath = path.join(this.reposDir, entry.name);
            const repo = {
                name: entry.name,
                path: repoPath,
                hasTests: false,
                testCommand: null,
                hasCI: false,
            };

            // Check for package.json with test script
            const pkgPath = path.join(repoPath, 'package.json');
            if (fs.existsSync(pkgPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    if (pkg.scripts && pkg.scripts.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
                        repo.hasTests = true;
                        repo.testCommand = 'npm test';
                    }
                } catch {
                    // Malformed package.json — skip test detection via this method
                }
            }

            // Check for test/tests directories if no test script found
            if (!repo.hasTests) {
                const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
                for (const dir of testDirs) {
                    const testDirPath = path.join(repoPath, dir);
                    if (fs.existsSync(testDirPath) && fs.statSync(testDirPath).isDirectory()) {
                        const files = fs.readdirSync(testDirPath);
                        const hasTestFiles = files.some(f =>
                            /\.(test|spec)\.(js|ts|mjs|cjs)$/.test(f) ||
                            /^test[_-]/.test(f) ||
                            /_test\.(js|ts)$/.test(f)
                        );
                        if (hasTestFiles) {
                            repo.hasTests = true;
                            // Determine runner: if package.json exists, use npm test; otherwise node
                            if (fs.existsSync(pkgPath)) {
                                repo.testCommand = 'npm test';
                            } else {
                                const firstTest = files.find(f => /\.(test|spec)\.(js|ts|mjs|cjs)$/.test(f));
                                repo.testCommand = firstTest
                                    ? `node ${path.join(dir, firstTest)}`
                                    : `node ${path.join(dir, files[0])}`;
                            }
                            break;
                        }
                    }
                }
            }

            // Check for pytest / pyproject.toml based tests
            if (!repo.hasTests) {
                const pyprojectPath = path.join(repoPath, 'pyproject.toml');
                const setupPyPath = path.join(repoPath, 'setup.py');
                if (fs.existsSync(pyprojectPath) || fs.existsSync(setupPyPath)) {
                    const testDirs = ['test', 'tests'];
                    for (const dir of testDirs) {
                        const testDirPath = path.join(repoPath, dir);
                        if (fs.existsSync(testDirPath) && fs.statSync(testDirPath).isDirectory()) {
                            const files = fs.readdirSync(testDirPath);
                            if (files.some(f => f.startsWith('test_') && f.endsWith('.py'))) {
                                repo.hasTests = true;
                                repo.testCommand = 'python -m pytest --tb=short -q';
                                break;
                            }
                        }
                    }
                }
            }

            // Detect CI configuration
            const ciPaths = [
                path.join(repoPath, '.github', 'workflows'),
                path.join(repoPath, '.circleci'),
                path.join(repoPath, '.gitlab-ci.yml'),
                path.join(repoPath, 'Jenkinsfile'),
                path.join(repoPath, 'render.yaml'),
            ];
            for (const ciPath of ciPaths) {
                if (fs.existsSync(ciPath)) {
                    repo.hasCI = true;
                    break;
                }
            }

            repos.push(repo);
        }

        if (!this.quiet) {
            const withTests = repos.filter(r => r.hasTests).length;
            const withCI = repos.filter(r => r.hasCI).length;
            console.log(`[SCAN] Found ${repos.length} repos (${withTests} with tests, ${withCI} with CI)`);
        }

        return repos;
    }

    // ─── RUN SINGLE REPO ─────────────────────────────────────────────────────

    /**
     * Run tests for a single repo. If tests fail, invoke MAPE-K self-healing.
     * @param {{ name, path, hasTests, testCommand, hasCI }} repo
     * @returns {{ name, success, healed, cyclesUsed, durationMs, error }}
     */
    async runRepo(repo) {
        const result = {
            name: repo.name,
            success: false,
            healed: false,
            cyclesUsed: 0,
            durationMs: 0,
            error: null,
        };

        if (!repo.hasTests || !repo.testCommand) {
            result.success = true; // No tests to fail
            result.error = 'no_tests';
            return result;
        }

        const start = Date.now();

        // First attempt: run tests directly
        try {
            execSync(repo.testCommand, {
                cwd: repo.path,
                timeout: this.testTimeout,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, NODE_ENV: 'test', FORCE_COLOR: '0' },
            });
            result.success = true;
            result.durationMs = Date.now() - start;

            if (!this.quiet) {
                console.log(`  [PASS] ${repo.name} (${result.durationMs}ms)`);
            }
            return result;
        } catch (err) {
            // Tests failed — capture error for healing
            result.error = (err.stderr || err.stdout || err.message || '').slice(0, 500);
        }

        // Tests failed: invoke MAPE-K self-healing
        if (!this.quiet) {
            console.log(`  [FAIL] ${repo.name} — initiating MAPE-K self-healing...`);
        }

        try {
            const engine = new MapeKEngine({
                projectRoot: repo.path,
                testCommand: repo.testCommand,
                testTimeout: this.testTimeout,
                maxCycles: this.maxHealCycles,
                verbose: !this.quiet,
            });

            const healResult = engine.runCycle();
            result.success = healResult.finalSuccess;
            result.healed = healResult.finalSuccess;
            result.cyclesUsed = healResult.cyclesUsed;
        } catch (healErr) {
            result.error = `Heal error: ${healErr.message}`;
        }

        result.durationMs = Date.now() - start;

        if (!this.quiet) {
            const status = result.success ? (result.healed ? 'HEALED' : 'PASS') : 'FAIL';
            console.log(`  [${status}] ${repo.name} (${result.durationMs}ms, ${result.cyclesUsed} cycles)`);
        }

        return result;
    }

    // ─── RUN ALL ─────────────────────────────────────────────────────────────

    /**
     * Run tests across all repos, respecting maxConcurrent via batching.
     * @returns {Array<{ name, success, healed, cyclesUsed, durationMs, error }>}
     */
    async runAll() {
        const repos = await this.scanRepos();
        const results = [];
        const startTime = Date.now();

        if (!this.quiet) {
            console.log('\n══════════════════════════════════════════════════════');
            console.log('  Heady Ecosystem Runner — Cross-Repo Test Sweep');
            console.log('  © 2026 Heady™Systems Inc.');
            console.log('══════════════════════════════════════════════════════\n');
        }

        // Prioritize repos with tests first
        const withTests = repos.filter(r => r.hasTests);
        const withoutTests = repos.filter(r => !r.hasTests);
        const ordered = [...withTests, ...withoutTests];

        // Process in batches of maxConcurrent
        for (let i = 0; i < ordered.length; i += this.maxConcurrent) {
            const batch = ordered.slice(i, i + this.maxConcurrent);
            const batchNum = Math.floor(i / this.maxConcurrent) + 1;
            const totalBatches = Math.ceil(ordered.length / this.maxConcurrent);

            if (!this.quiet) {
                console.log(`\n─── Batch ${batchNum}/${totalBatches} (${batch.length} repos) ───────────────`);
            }

            // Run batch concurrently using Promise.all
            const batchResults = await Promise.all(
                batch.map(repo => this.runRepo(repo))
            );

            results.push(...batchResults);
        }

        const totalDuration = Date.now() - startTime;

        if (!this.quiet) {
            console.log(`\n[DONE] Ecosystem sweep complete in ${totalDuration}ms`);
        }

        return results;
    }

    // ─── HEALTH SCORE ────────────────────────────────────────────────────────

    /**
     * Compute a φ-weighted health score across all repos.
     * Repos with tests weigh PHI× more than repos without.
     * @param {Array} results
     * @returns {{ score, totalRepos, reposWithTests, passed, failed, healed, noTests }}
     */
    computeHealthScore(results) {
        let weightedSum = 0;
        let totalWeight = 0;
        let passed = 0;
        let failed = 0;
        let healed = 0;
        let noTests = 0;
        let reposWithTests = 0;

        for (const r of results) {
            const hasTests = r.error !== 'no_tests';

            if (!hasTests) {
                noTests++;
                // Repos without tests get base weight of 1.0 and count as passing
                const weight = 1.0;
                weightedSum += weight * 1.0;
                totalWeight += weight;
                continue;
            }

            reposWithTests++;
            // Repos with tests weigh PHI× more
            const weight = PHI;

            if (r.success) {
                passed++;
                if (r.healed) {
                    healed++;
                    // Healed repos get a slight penalty (PSI_BOOST instead of full score)
                    weightedSum += weight * PSI_BOOST;
                } else {
                    weightedSum += weight * 1.0;
                }
            } else {
                failed++;
                // Failed repos get PSI_CRITICAL score
                weightedSum += weight * PSI_CRITICAL;
            }

            totalWeight += weight;
        }

        const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

        return {
            score,
            totalRepos: results.length,
            reposWithTests,
            passed,
            failed,
            healed,
            noTests,
        };
    }

    // ─── REPORT ──────────────────────────────────────────────────────────────

    /**
     * Generate a full JSON ecosystem health report.
     * @param {Array} results — Array of per-repo results from runAll()
     * @returns {Object} Full report with timestamp, scores, per-repo details
     */
    generateReport(results) {
        const health = this.computeHealthScore(results);
        const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);

        // Classify repos by status
        const failedRepos = results.filter(r => !r.success && r.error !== 'no_tests');
        const healedRepos = results.filter(r => r.healed);
        const passingRepos = results.filter(r => r.success && !r.healed && r.error !== 'no_tests');
        const noTestRepos = results.filter(r => r.error === 'no_tests');

        // Determine ecosystem status
        let ecosystemStatus = 'healthy';
        if (health.score < PSI_CRITICAL) {
            ecosystemStatus = 'critical';
        } else if (health.score < PSI_BOOST) {
            ecosystemStatus = 'degraded';
        } else if (health.failed > 0) {
            ecosystemStatus = 'warning';
        }

        const report = {
            timestamp: new Date().toISOString(),
            ecosystemStatus,
            healthScore: {
                overall: parseFloat(health.score.toFixed(4)),
                phiWeight: PHI,
                psiCriticalThreshold: PSI_CRITICAL,
                psiBoostThreshold: PSI_BOOST,
            },
            summary: {
                totalRepos: health.totalRepos,
                reposWithTests: health.reposWithTests,
                reposWithoutTests: health.noTests,
                passed: health.passed,
                failed: health.failed,
                healed: health.healed,
                passRate: health.reposWithTests > 0
                    ? parseFloat(((health.passed / health.reposWithTests) * 100).toFixed(1))
                    : 100,
                healRate: health.failed + health.healed > 0
                    ? parseFloat(((health.healed / (health.failed + health.healed)) * 100).toFixed(1))
                    : 0,
            },
            timing: {
                totalDurationMs,
                avgPerRepoMs: results.length > 0
                    ? Math.round(totalDurationMs / results.length)
                    : 0,
            },
            repos: {
                passing: passingRepos.map(r => ({
                    name: r.name,
                    durationMs: r.durationMs,
                })),
                healed: healedRepos.map(r => ({
                    name: r.name,
                    cyclesUsed: r.cyclesUsed,
                    durationMs: r.durationMs,
                })),
                failed: failedRepos.map(r => ({
                    name: r.name,
                    cyclesUsed: r.cyclesUsed,
                    durationMs: r.durationMs,
                    error: r.error,
                })),
                noTests: noTestRepos.map(r => r.name),
            },
            fibonacci: FIB,
            generatedBy: 'Heady Ecosystem Runner v1.0.0',
        };

        return report;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);

    // Parse CLI arguments
    let reposDir = '/home/user';
    let maxConcurrent = FIB[5]; // 8
    let writeReport = false;
    let quiet = false;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--repos-dir':
                reposDir = args[++i];
                break;
            case '--max-concurrent':
                maxConcurrent = parseInt(args[++i], 10) || FIB[5];
                break;
            case '--report':
                writeReport = true;
                break;
            case '--quiet':
                quiet = true;
                break;
            case '--help':
            case '-h':
                console.log('Heady Ecosystem Runner — Cross-Repo Autonomous Self-Healing Test Runner');
                console.log('© 2026 Heady™Systems Inc.\n');
                console.log('Usage: ecosystem-runner [options]\n');
                console.log('Options:');
                console.log('  --repos-dir <path>      Root directory containing repos (default: /home/user)');
                console.log('  --max-concurrent <n>    Max concurrent repo test runs (default: 8)');
                console.log('  --report                Write JSON report to ecosystem-report.json');
                console.log('  --quiet                 Suppress per-repo output');
                console.log('  --help, -h              Show this help');
                process.exit(0);
                break;
            default:
                console.error(`Unknown option: ${args[i]}`);
                process.exit(1);
        }
    }

    const runner = new EcosystemRunner({
        reposDir,
        maxConcurrent,
        quiet,
    });

    const results = await runner.runAll();
    const report = runner.generateReport(results);

    if (writeReport) {
        const reportPath = path.join(process.cwd(), 'ecosystem-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        if (!quiet) {
            console.log(`\n[REPORT] Written to ${reportPath}`);
        }
    }

    // Always print summary
    if (!quiet) {
        console.log('\n══════════════════════════════════════════════════════');
        console.log('  ECOSYSTEM HEALTH REPORT');
        console.log('══════════════════════════════════════════════════════');
        console.log(`  Status:        ${report.ecosystemStatus.toUpperCase()}`);
        console.log(`  φ Health Score: ${report.healthScore.overall}`);
        console.log(`  Total Repos:   ${report.summary.totalRepos}`);
        console.log(`  With Tests:    ${report.summary.reposWithTests}`);
        console.log(`  Passed:        ${report.summary.passed}`);
        console.log(`  Healed:        ${report.summary.healed}`);
        console.log(`  Failed:        ${report.summary.failed}`);
        console.log(`  Pass Rate:     ${report.summary.passRate}%`);
        console.log(`  Heal Rate:     ${report.summary.healRate}%`);
        console.log('══════════════════════════════════════════════════════\n');
    }

    // Exit with appropriate code
    const exitCode = report.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = { EcosystemRunner, PHI, PSI_CRITICAL, PSI_BOOST, FIB };

// Run CLI if invoked directly
if (require.main === module) {
    main().catch(err => {
        console.error(`[FATAL] ${err.message}`);
        process.exit(1);
    });
}

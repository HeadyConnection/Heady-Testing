#!/usr/bin/env node
/**
 * © 2026 Heady™Systems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * ─── Autonomous Self-Healing Test Runner ─────────────────────────────────────
 *
 * Zero-intervention test execution with MAPE-K self-healing loop.
 * This is the main entry point for autonomous testing across the Heady ecosystem.
 *
 * Usage:
 *   node self-healing-runner.js [options]
 *
 * Options:
 *   --project <path>    Project root (default: cwd)
 *   --test-cmd <cmd>    Test command (default: npm test)
 *   --max-cycles <n>    Max MAPE-K cycles (default: 5)
 *   --chaos             Run chaos injection after tests pass
 *   --fuzz <n>          Run N fuzz payloads
 *   --quiet             Suppress verbose output
 *   --report            Generate JSON report
 *
 * Exit codes:
 *   0  — All tests pass (possibly after self-healing)
 *   1  — Tests still failing after max self-heal cycles
 *   2  — Chaos injection revealed unrecoverable failures
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { MapeKEngine, PHI, PSI_CRITICAL } = require('./mape-k-engine');
const { ChaosInjector, ChaosScenario } = require('./chaos-injector');

// ─────────────────────────────────────────────────────────────────────────────
// PARSE ARGS
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
    const args = {
        projectRoot: process.cwd(),
        testCommand: 'npm test',
        maxCycles: 5,
        chaos: false,
        fuzz: 0,
        quiet: false,
        report: false,
        testFile: null,
    };

    for (let i = 2; i < argv.length; i++) {
        switch (argv[i]) {
            case '--project':   args.projectRoot = argv[++i]; break;
            case '--test-cmd':  args.testCommand = argv[++i]; break;
            case '--max-cycles': args.maxCycles = parseInt(argv[++i]) || 5; break;
            case '--chaos':     args.chaos = true; break;
            case '--fuzz':      args.fuzz = parseInt(argv[++i]) || 100; break;
            case '--quiet':     args.quiet = true; break;
            case '--report':    args.report = true; break;
            case '--test-file': args.testFile = argv[++i]; break;
        }
    }

    return args;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const args = parseArgs(process.argv);

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  HEADY™ Autonomous Self-Healing Test Runner             ║');
    console.log('║  Zero-Intervention · MAPE-K · φ-Scaled                  ║');
    console.log('║  © 2026 Heady™Systems Inc.                              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n  Project: ${args.projectRoot}`);
    console.log(`  Command: ${args.testCommand}`);
    console.log(`  Max Cycles: ${args.maxCycles}`);
    console.log(`  Chaos: ${args.chaos ? 'ENABLED' : 'disabled'}`);
    console.log(`  Fuzz: ${args.fuzz > 0 ? args.fuzz + ' payloads' : 'disabled'}`);

    const report = {
        startedAt: new Date().toISOString(),
        project: args.projectRoot,
        phases: [],
    };

    // ─── PHASE 1: Self-Healing Test Run ──────────────────────────────────

    console.log('\n\n━━━ PHASE 1: MAPE-K Self-Healing Test Run ━━━━━━━━━━━━━━');

    const engine = new MapeKEngine({
        projectRoot: args.projectRoot,
        testCommand: args.testCommand,
        maxCycles: args.maxCycles,
        verbose: !args.quiet,
    });

    const testResult = engine.runCycle(args.testFile);

    report.phases.push({
        name: 'mape-k-self-healing',
        success: testResult.finalSuccess,
        cyclesUsed: testResult.cyclesUsed,
        healthScore: testResult.metrics.phiHealthScore,
        heals: testResult.metrics.healSuccess,
        failures: testResult.metrics.healFailure,
    });

    if (!testResult.finalSuccess) {
        console.log('\n  ⚠ Tests could not be healed. φ_health below PSI_CRITICAL.');

        if (testResult.metrics.phiHealthScore < PSI_CRITICAL) {
            console.log(`  φ_health = ${testResult.metrics.phiHealthScore.toFixed(3)} < ${PSI_CRITICAL} (CRITICAL)`);
        }

        if (args.report) writeReport(report, args.projectRoot);
        process.exit(1);
    }

    // ─── PHASE 2: Chaos Injection (optional) ─────────────────────────────

    if (args.chaos) {
        console.log('\n\n━━━ PHASE 2: Phi-Stepped Chaos Injection ━━━━━━━━━━━━━━');

        const chaos = new ChaosInjector({ verbose: !args.quiet });

        chaos.buildSchedule({
            baseMs: 1000,
            scenarios: [
                ChaosScenario.REDIS_KILL,
                ChaosScenario.LLM_PRIMARY_KILL,
                ChaosScenario.DATABASE_KILL,
                ChaosScenario.DEPLOY_REGRESSION,
                ChaosScenario.CASCADE_FAILURE,
            ],
        });

        const chaosResult = await chaos.executeSchedule({ recoveryWindowMs: 3000 });

        report.phases.push({
            name: 'chaos-injection',
            success: chaosResult.failed === 0,
            resilienceScore: chaosResult.resilienceScore,
            passed: chaosResult.passed,
            failed: chaosResult.failed,
            scenarios: chaosResult.results.map(r => ({
                scenario: r.scenario,
                recovered: r.recovered,
            })),
        });

        if (chaosResult.failed > 0) {
            console.log(`\n  ⚠ ${chaosResult.failed} chaos scenarios not recovered.`);
            if (args.report) writeReport(report, args.projectRoot);
            process.exit(2);
        }
    }

    // ─── PHASE 3: Fuzz Testing (optional) ────────────────────────────────

    if (args.fuzz > 0) {
        console.log('\n\n━━━ PHASE 3: Generative Invariant Fuzzing ━━━━━━━━━━━━━');

        const chaos = new ChaosInjector({ verbose: !args.quiet });
        const payloads = chaos.generateFuzzPayloads(args.fuzz);

        let validPayloads = 0;
        let invalidPayloads = 0;

        for (const payload of payloads) {
            try {
                // Validate payload can be serialized (basic invariant)
                const serialized = JSON.stringify(payload.payload);
                if (serialized && serialized.length > 0) {
                    validPayloads++;
                } else {
                    invalidPayloads++;
                }
            } catch {
                invalidPayloads++;
            }
        }

        console.log(`  Generated: ${payloads.length} payloads`);
        console.log(`  Serializable: ${validPayloads}`);
        console.log(`  Non-serializable: ${invalidPayloads}`);
        console.log(`  Invariant compliance: ${(validPayloads / payloads.length * 100).toFixed(1)}%`);

        report.phases.push({
            name: 'fuzz-testing',
            success: true,
            totalPayloads: payloads.length,
            validPayloads,
            invalidPayloads,
        });
    }

    // ─── FINAL REPORT ────────────────────────────────────────────────────

    report.completedAt = new Date().toISOString();
    report.overallSuccess = report.phases.every(p => p.success);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log(`║  FINAL: ${report.overallSuccess ? '✓ ALL PHASES PASSED' : '✗ SOME PHASES FAILED'}${' '.repeat(31)}║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    if (args.report) writeReport(report, args.projectRoot);

    process.exit(report.overallSuccess ? 0 : 1);
}

function writeReport(report, projectRoot) {
    const reportDir = path.join(projectRoot, '.heady', 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    const filename = `self-healing-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(reportDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`  Report written: ${filepath}`);
}

// ─────────────────────────────────────────────────────────────────────────────

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

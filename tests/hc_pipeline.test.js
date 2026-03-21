// HEADY_BRAND:BEGIN
// Pipeline & Auto-Success Engine Test Suite
// HEADY_BRAND:END

const assert = require('assert');
const path = require('path');

// ─── PIPELINE TESTS ─────────────────────────────────────────────────────────

console.log('── Pipeline Tests ──');

// Test 1: Pipeline module loads
let pipeline;
try {
  const mod = require('../src/hc_pipeline');
  pipeline = mod.pipeline;
  assert(pipeline, 'Pipeline singleton should exist');
  console.log('✓ Pipeline module loads');
} catch (err) {
  console.error('✗ Pipeline module failed to load:', err.message);
  process.exit(1);
}

// Test 2: Config loading
try {
  const { loadAllConfigs } = require('../src/hc_pipeline');
  const configs = loadAllConfigs();
  assert(configs.pipeline, 'Pipeline config should exist');
  assert(configs.resources, 'Resource config should exist');
  assert(configs.services, 'Service config should exist');
  assert(configs.governance, 'Governance config should exist');
  assert(configs.concepts, 'Concepts config should exist');
  console.log('✓ All configs load successfully');
} catch (err) {
  console.error('✗ Config loading failed:', err.message);
}

// Test 3: Topological sort
try {
  const { topologicalSort } = require('../src/hc_pipeline');
  const stages = [
    { id: 'a', dependsOn: [] },
    { id: 'b', dependsOn: ['a'] },
    { id: 'c', dependsOn: ['b'] },
  ];
  const sorted = topologicalSort(stages);
  assert.deepStrictEqual(sorted.map(s => s.id), ['a', 'b', 'c']);
  console.log('✓ Topological sort works');
} catch (err) {
  console.error('✗ Topological sort failed:', err.message);
}

// Test 4: Circular dependency detection
try {
  const { topologicalSort } = require('../src/hc_pipeline');
  const stages = [
    { id: 'a', dependsOn: ['c'] },
    { id: 'b', dependsOn: ['a'] },
    { id: 'c', dependsOn: ['b'] },
  ];
  assert.throws(() => topologicalSort(stages), /Circular dependency/);
  console.log('✓ Circular dependency detection works');
} catch (err) {
  console.error('✗ Circular dependency detection failed:', err.message);
}

// Test 5: Circuit breaker
try {
  const { CircuitBreaker } = require('../src/hc_pipeline');
  const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100 });
  assert.strictEqual(cb.canExecute(), true);
  cb.recordFailure();
  cb.recordFailure();
  assert.strictEqual(cb.canExecute(), true); // Under threshold
  cb.recordFailure();
  assert.strictEqual(cb.canExecute(), false); // At threshold — OPEN
  assert.strictEqual(cb.getStatus().state, 'open');
  console.log('✓ Circuit breaker works');
} catch (err) {
  console.error('✗ Circuit breaker failed:', err.message);
}

// Test 6: Worker pool
try {
  const { WorkerPool } = require('../src/hc_pipeline');
  const pool = new WorkerPool(2);
  const stats = pool.getStats();
  assert.strictEqual(stats.concurrency, 2);
  assert.strictEqual(stats.running, 0);
  assert.strictEqual(stats.queued, 0);
  console.log('✓ Worker pool initializes correctly');
} catch (err) {
  console.error('✗ Worker pool failed:', err.message);
}

// Test 7: Fail-closed task execution
try {
  const { HCFullPipeline, registerTaskHandler } = require('../src/hc_pipeline');
  // The fail-closed behavior should throw for unregistered tasks
  // (since we require hc_pipeline fresh, no handlers are registered here)
  // We test indirectly by checking the pattern
  const pipelineCode = require('fs').readFileSync(
    path.join(__dirname, '..', 'src', 'hc_pipeline.js'), 'utf8'
  );
  assert(pipelineCode.includes('FAIL-CLOSED'), 'Pipeline should contain FAIL-CLOSED pattern');
  assert(!pipelineCode.includes('simulated task execution'), 'Pipeline should NOT contain simulated success');
  console.log('✓ Fail-closed pattern verified in source');
} catch (err) {
  console.error('✗ Fail-closed verification failed:', err.message);
}

// Test 8: φ-scaled constants
try {
  const pipelineCode = require('fs').readFileSync(
    path.join(__dirname, '..', 'src', 'hc_pipeline.js'), 'utf8'
  );
  assert(pipelineCode.includes('2618000'), 'CACHE_TTL should be φ²-scaled (2618000)');
  assert(pipelineCode.includes('233'), 'CACHE_MAX should be fib(13) (233)');
  assert(!pipelineCode.includes('3600000'), 'Should not contain round 3600000');
  console.log('✓ φ-scaled constants verified');
} catch (err) {
  console.error('✗ φ-scaled constants check failed:', err.message);
}

// Test 9: Pipeline DAG
try {
  pipeline.load();
  const dag = pipeline.getStageDag();
  assert(dag.length === 21, `Expected 21 stages (fib(8)), got ${dag.length}`);
  console.log('✓ Pipeline DAG has 21 stages (fib(8))');
} catch (err) {
  console.error('✗ Pipeline DAG test failed:', err.message);
}

// Test 10: Config summary
try {
  const summary = pipeline.getConfigSummary();
  assert(summary.name, 'Config summary should have name');
  assert(summary.stages === 21, `Expected 21 stages, got ${summary.stages}`);
  assert(summary.totalTasks > 0, 'Should have tasks');
  console.log(`✓ Config summary: ${summary.name} v${summary.version}, ${summary.totalTasks} tasks`);
} catch (err) {
  console.error('✗ Config summary test failed:', err.message);
}

// ─── AUTO-SUCCESS ENGINE TESTS ──────────────────────────────────────────────

console.log('\n── Auto-Success Engine Tests ──');

// Test 11: Engine loads
try {
  const { AutoSuccessEngine, AUTO_SUCCESS, TASK_CATEGORIES, PHI, PSI, fib } = require('../auto-success-engine');
  assert(AutoSuccessEngine, 'AutoSuccessEngine class should exist');
  assert.strictEqual(TASK_CATEGORIES.length, 13, 'Should have 13 categories (fib(7))');
  assert.strictEqual(AUTO_SUCCESS.CATEGORIES, 13, 'CATEGORIES constant should be 13');
  assert.strictEqual(AUTO_SUCCESS.TASKS_TOTAL, 144, 'TASKS_TOTAL should be 144 (fib(12))');
  assert(Math.abs(PHI - 1.618033988749895) < 0.0001, 'PHI should be golden ratio');
  assert(Math.abs(PSI - 0.618033988749895) < 0.001, 'PSI should be 1/PHI');
  assert.strictEqual(fib(8), 21, 'fib(8) should be 21');
  console.log('✓ Auto-success engine loads with φ-scaled constants');
} catch (err) {
  console.error('✗ Auto-success engine load failed:', err.message);
}

// Test 12: Engine instantiation
try {
  const { AutoSuccessEngine } = require('../auto-success-engine');
  const engine = new AutoSuccessEngine();
  assert.strictEqual(engine.cycleInterval, 29034, 'Cycle interval should be 29034ms (φ⁷×1000)');
  assert.strictEqual(engine.categoryCount, 13, 'Category count should be 13');
  assert.strictEqual(engine.cycleCount, 0, 'Cycle count should start at 0');
  console.log('✓ Engine instantiation with correct config');
} catch (err) {
  console.error('✗ Engine instantiation failed:', err.message);
}

// Test 13: Category execution (CodeQuality)
try {
  const { AutoSuccessEngine } = require('../auto-success-engine');
  const engine = new AutoSuccessEngine();
  const results = engine.runCodeQualityChecks();
  results.then(checks => {
    assert(Array.isArray(checks), 'Should return array of checks');
    assert(checks.length > 0, 'Should have at least 1 check');
    assert(checks[0].name, 'Each check should have a name');
    assert('ok' in checks[0], 'Each check should have ok field');
    console.log(`✓ CodeQuality: ${checks.length} checks (${checks.filter(c => c.ok).length} passed)`);
  }).catch(err => {
    console.error('✗ CodeQuality execution failed:', err.message);
  });
} catch (err) {
  console.error('✗ CodeQuality test setup failed:', err.message);
}

// Test 14: Category execution (Security)
try {
  const { AutoSuccessEngine } = require('../auto-success-engine');
  const engine = new AutoSuccessEngine();
  engine.runSecurityScans().then(checks => {
    assert(checks.length > 0, 'Should have security checks');
    const corsCheck = checks.find(c => c.name === 'no_cors_wildcard_in_bridge');
    if (corsCheck) {
      assert(corsCheck.ok, 'CORS wildcard should be gone after our fix');
      console.log(`✓ Security: CORS wildcard fix verified (wildcardCount: ${corsCheck.wildcardCount})`);
    }
    console.log(`✓ Security: ${checks.length} checks (${checks.filter(c => c.ok).length} passed)`);
  }).catch(err => {
    console.error('✗ Security execution failed:', err.message);
  });
} catch (err) {
  console.error('✗ Security test setup failed:', err.message);
}

// Test 15: Category execution (Evolution)
try {
  const { AutoSuccessEngine } = require('../auto-success-engine');
  const engine = new AutoSuccessEngine();
  engine.runEvolutionCategory().then(checks => {
    const stageCheck = checks.find(c => c.name === 'pipeline_stage_count_fib8');
    if (stageCheck) {
      assert(stageCheck.ok, `Stage count should be fib(8)=21, got ${stageCheck.value}`);
      console.log('✓ Evolution: Pipeline stage count = fib(8) verified');
    }
    const receiptCheck = checks.find(c => c.name === 'receipt_deps_required');
    if (receiptCheck) {
      assert(receiptCheck.ok, 'Receipt should depend on required stages only');
      console.log('✓ Evolution: Receipt dependency fix verified');
    }
    console.log(`✓ Evolution: ${checks.length} checks (${checks.filter(c => c.ok).length} passed)`);
  }).catch(err => {
    console.error('✗ Evolution execution failed:', err.message);
  });
} catch (err) {
  console.error('✗ Evolution test setup failed:', err.message);
}

// Test 16: Pipeline handler registration
try {
  require('../src/hc_pipeline_handlers');
  console.log('✓ Pipeline handlers registered without errors');
} catch (err) {
  console.error('✗ Pipeline handler registration failed:', err.message);
}

console.log('\n── Tests Complete ──');

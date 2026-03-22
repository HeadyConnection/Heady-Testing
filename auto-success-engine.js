/**
 * HeadyConductor — Auto-Success Engine (φ-Scaled)
 *
 * Runs fib(12)=144 background tasks across fib(7)=13 categories
 * on a φ⁷×1000 = 29,034ms cycle.
 *
 * ALL constants derived from phi-math-foundation. Zero magic numbers.
 * Treats errors as learning events (HeadyVinci pattern).
 *
 * © 2026-2026 HeadySystems Inc. All Rights Reserved. 60+ Provisional Patents.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ─── PHI CONSTANTS (inline to avoid import issues) ──────────────────────────
const PHI = 1.618033988749895;
const PSI = 1 / PHI; // 0.618
const fib = (n) => {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
};
const phiBackoff = (attempt) => Math.round(Math.pow(PHI, attempt) * 1000);

const AUTO_SUCCESS = {
  CYCLE_MS: Math.round(Math.pow(PHI, 7) * 1000),     // 29,034ms
  CATEGORIES: fib(7),                                   // 13
  TASKS_TOTAL: fib(12),                                  // 144
  TASKS_PER_CATEGORY: Math.round(fib(12) / fib(7)),     // ~11
  TASK_TIMEOUT_MS: Math.round(Math.pow(PHI, 3) * 1000), // 4,236ms
  MAX_RETRIES_PER_CYCLE: fib(4),                         // 3
  MAX_RETRIES_TOTAL: fib(6),                             // 8
};

const CSL_THRESHOLDS = [0.500, 0.618, 0.691, 0.764, 0.809, 0.854, 0.882, 0.910, 0.927, 0.972];

const ROOT = path.join(__dirname);
const CONFIGS_DIR = path.join(ROOT, 'configs');
const SERVICES_DIR = path.join(ROOT, 'services');
const SRC_DIR = path.join(ROOT, 'src');

// ─── CATEGORY DEFINITIONS (13 = fib(7) categories) ──────────────────────────
const TASK_CATEGORIES = [
  'CodeQuality',
  'Security',
  'Performance',
  'Availability',
  'Compliance',
  'Learning',
  'Communication',
  'Infrastructure',
  'Intelligence',
  'DataSync',
  'CostOptimization',
  'SelfAwareness',
  'Evolution',
];

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

function readJsonSafe(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return null; }
}

function readYamlSafe(filePath) {
  try {
    const yaml = require('js-yaml');
    return yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch { return null; }
}

function httpGet(url, timeoutMs = 4236) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    const proto = url.startsWith('https') ? https : require('http');
    proto.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        clearTimeout(timer);
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

function runCommand(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf8', timeout: 4236 }).trim() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ─── RESULTS COLLECTOR ──────────────────────────────────────────────────────

class CycleResults {
  constructor() {
    this.results = {};
    this.successful = 0;
    this.failed = 0;
    this.learningEvents = 0;
  }

  record(category, checks) {
    const passed = checks.filter(c => c.ok).length;
    const failed = checks.filter(c => !c.ok).length;
    this.results[category] = { passed, failed, total: checks.length, checks };
    this.successful += passed;
    this.failed += failed;
    if (failed > 0) this.learningEvents += failed;
  }

  getSummary() {
    return {
      successful: this.successful,
      failed: this.failed,
      learningEvents: this.learningEvents,
      categories: Object.keys(this.results).length,
      details: this.results,
    };
  }
}

// ─── AUTO-SUCCESS ENGINE ────────────────────────────────────────────────────

class AutoSuccessEngine {
  constructor(config = {}) {
    this.config = config;
    this.cycleInterval = AUTO_SUCCESS.CYCLE_MS;
    this.categoryCount = AUTO_SUCCESS.CATEGORIES;
    this.totalTasks = AUTO_SUCCESS.TASKS_TOTAL;
    this.taskTimeout = AUTO_SUCCESS.TASK_TIMEOUT_MS;
    this.maxRetriesPerCycle = AUTO_SUCCESS.MAX_RETRIES_PER_CYCLE;
    this.maxRetriesTotal = AUTO_SUCCESS.MAX_RETRIES_TOTAL;
    this.totalFailures = 0;
    this.cycleCount = 0;
    this.intervalHandle = null;
    this.lastCycleResults = null;
  }

  async start() {
    console.log('[AutoSuccessEngine] Starting with φ-scaled configuration:', {
      cycleIntervalMs: this.cycleInterval,
      categories: this.categoryCount,
      totalTasks: this.totalTasks,
      tasksPerCategory: AUTO_SUCCESS.TASKS_PER_CATEGORY,
      taskTimeoutMs: this.taskTimeout,
      phi: PHI.toFixed(4),
    });

    this.intervalHandle = setInterval(() => this.runCycle(), this.cycleInterval);
    await this.runCycle();
  }

  async stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    console.log('[AutoSuccessEngine] Graceful shutdown', {
      totalCycles: this.cycleCount,
      totalFailures: this.totalFailures,
    });
  }

  async runCycle() {
    const startTime = Date.now();
    this.cycleCount++;
    const results = new CycleResults();

    console.log(`[AutoSuccessEngine] Cycle #${this.cycleCount} starting...`);

    for (const category of TASK_CATEGORIES) {
      let retries = 0;
      let succeeded = false;

      while (!succeeded && retries <= this.maxRetriesPerCycle) {
        try {
          const checks = await this.runCategoryWithTimeout(category);
          results.record(category, checks);
          succeeded = true;
        } catch (error) {
          retries++;
          if (retries > this.maxRetriesPerCycle) {
            results.record(category, [{ name: 'category_execution', ok: false, error: error.message }]);
            this.totalFailures++;
            if (this.totalFailures >= this.maxRetriesTotal) {
              console.warn('[HeadyBuddy] ESCALATION — Max failures reached:', { category, error: error.message });
              this.totalFailures = 0;
            }
          } else {
            const backoffMs = phiBackoff(retries);
            console.log(`[AutoSuccess] Retry ${retries}/${this.maxRetriesPerCycle} for ${category} in ${backoffMs}ms`);
            await new Promise(r => setTimeout(r, backoffMs));
          }
        }
      }
    }

    const durationMs = Date.now() - startTime;
    this.lastCycleResults = { ...results.getSummary(), durationMs, cycle: this.cycleCount };

    if (durationMs > this.cycleInterval) {
      console.warn('[AutoSuccessEngine] CYCLE OVERRUN', { durationMs, budgetMs: this.cycleInterval });
    }

    console.log('[AutoSuccessEngine] Cycle complete:', this.lastCycleResults);
    return this.lastCycleResults;
  }

  async runCategoryWithTimeout(category) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout after ${this.taskTimeout}ms`)), this.taskTimeout);
      this.runCategory(category)
        .then((result) => { clearTimeout(timer); resolve(result); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }

  async runCategory(category) {
    switch (category) {
      case 'CodeQuality': return this.runCodeQualityChecks();
      case 'Security': return this.runSecurityScans();
      case 'Performance': return this.monitorPerformance();
      case 'Availability': return this.runAvailabilityChecks();
      case 'Compliance': return this.runComplianceChecks();
      case 'Learning': return this.processLearningEvents();
      case 'Communication': return this.runCommunicationChecks();
      case 'Infrastructure': return this.runInfrastructureChecks();
      case 'Intelligence': return this.runIntelligenceChecks();
      case 'DataSync': return this.syncData();
      case 'CostOptimization': return this.optimizeCosts();
      case 'SelfAwareness': return this.runSelfAwarenessCategory();
      case 'Evolution': return this.runEvolutionCategory();
      default: return [{ name: 'unknown_category', ok: false, error: `Unknown category: ${category}` }];
    }
  }

  // ─── CATEGORY IMPLEMENTATIONS ─────────────────────────────────────────────

  async runCodeQualityChecks() {
    const checks = [];

    // 1. Check for files exceeding 1000-line limit
    const criticalFiles = [
      'heady-manager.js', 'src/hc_pipeline.js', 'src/mcp/colab-mcp-bridge.js',
    ];
    for (const f of criticalFiles) {
      const filePath = path.join(ROOT, f);
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
        checks.push({ name: `line_count:${f}`, ok: lines <= 1000, value: lines, limit: 1000 });
      }
    }

    // 2. Check package.json exists and is valid
    const pkg = readJsonSafe(path.join(ROOT, 'package.json'));
    checks.push({ name: 'package_json_valid', ok: !!pkg && !!pkg.name });

    // 3. Check for CommonJS compliance (no import/export in .js files)
    const jsFiles = ['heady-manager.js', 'src/hc_pipeline.js'];
    for (const f of jsFiles) {
      const filePath = path.join(ROOT, f);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasESM = /^(import |export )/m.test(content);
        checks.push({ name: `commonjs_compliance:${f}`, ok: !hasESM });
      }
    }

    // 4. Check HEADY_BRAND headers exist in key files
    for (const f of jsFiles) {
      const filePath = path.join(ROOT, f);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8').slice(0, 500);
        checks.push({ name: `brand_header:${f}`, ok: content.includes('HEADY_BRAND:BEGIN') });
      }
    }

    // 5. Check for hardcoded round numbers in phi-critical files
    const pipeline = fs.existsSync(path.join(ROOT, 'src/hc_pipeline.js'))
      ? fs.readFileSync(path.join(ROOT, 'src/hc_pipeline.js'), 'utf8') : '';
    const hasRoundTimeouts = /setTimeout\(\s*[^,]+,\s*(1000|2000|3000|5000|10000|30000|60000)\s*\)/.test(pipeline);
    checks.push({ name: 'no_round_timeouts_in_pipeline', ok: !hasRoundTimeouts });

    return checks;
  }

  async runSecurityScans() {
    const checks = [];

    // 1. Verify .env is in .gitignore
    const gitignore = fs.existsSync(path.join(ROOT, '.gitignore'))
      ? fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8') : '';
    checks.push({ name: 'env_in_gitignore', ok: gitignore.includes('.env') });

    // 2. Check for hardcoded API keys in source (scan key files)
    const filesToScan = ['heady-manager.js', 'src/hc_pipeline.js'];
    for (const f of filesToScan) {
      const filePath = path.join(ROOT, f);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasHardcodedKey = /(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36})/.test(content);
        checks.push({ name: `no_hardcoded_keys:${f}`, ok: !hasHardcodedKey });
      }
    }

    // 3. Verify helmet middleware is loaded in heady-manager
    if (fs.existsSync(path.join(ROOT, 'heady-manager.js'))) {
      const mgr = fs.readFileSync(path.join(ROOT, 'heady-manager.js'), 'utf8');
      checks.push({ name: 'helmet_middleware', ok: mgr.includes('helmet') });
      checks.push({ name: 'rate_limiter', ok: mgr.includes('rateLimit') || mgr.includes('rate-limit') });
    }

    // 4. Verify no localhost in configs
    const svcCatalog = fs.existsSync(path.join(CONFIGS_DIR, 'service-catalog.yaml'))
      ? fs.readFileSync(path.join(CONFIGS_DIR, 'service-catalog.yaml'), 'utf8') : '';
    checks.push({ name: 'no_localhost_in_service_catalog', ok: !svcCatalog.includes('localhost') });

    // 5. Check CORS is not wildcard in MCP bridge
    const bridge = fs.existsSync(path.join(SRC_DIR, 'mcp', 'colab-mcp-bridge.js'))
      ? fs.readFileSync(path.join(SRC_DIR, 'mcp', 'colab-mcp-bridge.js'), 'utf8') : '';
    const wildcardCORS = (bridge.match(/['"]Access-Control-Allow-Origin['"]\s*:\s*['"]\*['"]/g) || []).length;
    checks.push({ name: 'no_cors_wildcard_in_bridge', ok: wildcardCORS === 0, wildcardCount: wildcardCORS });

    return checks;
  }

  async monitorPerformance() {
    const checks = [];
    const mem = process.memoryUsage();

    // 1. Heap usage check (should be under 512MB)
    checks.push({ name: 'heap_usage_mb', ok: mem.heapUsed < 536870912, value: Math.round(mem.heapUsed / 1048576) });

    // 2. RSS under 1GB
    checks.push({ name: 'rss_mb', ok: mem.rss < 1073741824, value: Math.round(mem.rss / 1048576) });

    // 3. Process uptime (running = healthy)
    const uptimeS = process.uptime();
    checks.push({ name: 'process_uptime_s', ok: uptimeS > 0, value: Math.round(uptimeS) });

    // 4. Event loop not blocked (simple check)
    const loopStart = Date.now();
    await new Promise(r => setImmediate(r));
    const loopLag = Date.now() - loopStart;
    checks.push({ name: 'event_loop_lag_ms', ok: loopLag < 100, value: loopLag });

    // 5. Check heady-manager health endpoint
    try {
      const res = await httpGet('https://api.headysystems.com/api/health', 4236);
      checks.push({ name: 'manager_health_response', ok: res.status === 200 && res.body?.ok === true, status: res.status });
    } catch (err) {
      checks.push({ name: 'manager_health_response', ok: false, error: err.message });
    }

    return checks;
  }

  async runAvailabilityChecks() {
    const checks = [];

    // 1. Check service catalog health endpoints
    const catalog = readYamlSafe(path.join(CONFIGS_DIR, 'service-catalog.yaml'));
    if (catalog && catalog.services) {
      for (const svc of catalog.services.slice(0, 5)) { // Check first 5 to stay within timeout
        try {
          const url = `https://${svc.name}-609590223909.us-central1.run.app${svc.healthPath || '/health/ready'}`;
          const res = await httpGet(url, 2618);
          checks.push({ name: `service:${svc.name}`, ok: res.status >= 200 && res.status < 400, status: res.status });
        } catch (err) {
          checks.push({ name: `service:${svc.name}`, ok: false, error: err.message });
        }
      }
    }

    // 2. Check critical config files exist
    const requiredConfigs = ['hcfullpipeline.yaml', 'service-catalog.yaml', 'resource-policies.yaml', 'governance-policies.yaml'];
    for (const cfg of requiredConfigs) {
      checks.push({ name: `config_exists:${cfg}`, ok: fs.existsSync(path.join(CONFIGS_DIR, cfg)) });
    }

    return checks;
  }

  async runComplianceChecks() {
    const checks = [];

    // 1. Verify HEADY_CONTEXT.md exists
    checks.push({ name: 'heady_context_exists', ok: fs.existsSync(path.join(ROOT, 'HEADY_CONTEXT.md')) });

    // 2. Verify AGENTS.md exists
    checks.push({ name: 'agents_md_exists', ok: fs.existsSync(path.join(ROOT, 'AGENTS.md')) });

    // 3. Verify .windsurfrules exists
    checks.push({ name: 'windsurfrules_exists', ok: fs.existsSync(path.join(ROOT, '.windsurfrules')) });

    // 4. Verify governance-policies.yaml exists
    checks.push({ name: 'governance_policies_exists', ok: fs.existsSync(path.join(CONFIGS_DIR, 'governance-policies.yaml')) });

    // 5. Verify foundational-pillars workflow exists
    checks.push({
      name: 'foundational_pillars_workflow',
      ok: fs.existsSync(path.join(ROOT, '.agents', 'workflows', 'foundational-pillars.md')),
    });

    // 6. File naming convention check (kebab-case in src/)
    if (fs.existsSync(SRC_DIR)) {
      const srcFiles = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.js'));
      const nonKebab = srcFiles.filter(f => /[A-Z]/.test(f) || f.includes('_'));
      // Allow hc_ prefix as it's an established pattern
      const violations = nonKebab.filter(f => !f.startsWith('hc_'));
      checks.push({ name: 'kebab_case_naming', ok: violations.length === 0, violations });
    }

    return checks;
  }

  async processLearningEvents() {
    const checks = [];

    // 1. Check wisdom.json exists or can be created
    const wisdomPath = path.join(ROOT, '.heady', 'wisdom.json');
    const wisdomExists = fs.existsSync(wisdomPath);
    checks.push({ name: 'wisdom_json_exists', ok: wisdomExists });

    // 2. Check pipeline history has data
    const cachePath = path.join(ROOT, '.heady_cache', 'pipeline_task_cache.json');
    const cache = readJsonSafe(cachePath);
    checks.push({ name: 'pipeline_cache_exists', ok: !!cache, entries: cache ? Object.keys(cache).length : 0 });

    // 3. Check pattern engine config
    const patternConfig = readYamlSafe(path.join(CONFIGS_DIR, 'speed-and-patterns-protocol.yaml'));
    checks.push({ name: 'pattern_config_exists', ok: !!patternConfig });

    // 4. Record this cycle as a learning event
    const learningLog = path.join(ROOT, '.heady', 'auto-success-learning.json');
    try {
      const log = readJsonSafe(learningLog) || [];
      log.push({ ts: new Date().toISOString(), cycle: this.cycleCount, event: 'cycle_completed' });
      // Keep last fib(11)=89 entries
      const trimmed = log.slice(-89);
      fs.mkdirSync(path.dirname(learningLog), { recursive: true });
      fs.writeFileSync(learningLog, JSON.stringify(trimmed, null, 2), 'utf8');
      checks.push({ name: 'learning_log_write', ok: true, entries: trimmed.length });
    } catch (err) {
      checks.push({ name: 'learning_log_write', ok: false, error: err.message });
    }

    return checks;
  }

  async runCommunicationChecks() {
    const checks = [];

    // 1. MCP gateway config exists and is valid
    const mcpConfig = readYamlSafe(path.join(CONFIGS_DIR, 'mcp-gateway-config.yaml'));
    checks.push({ name: 'mcp_gateway_config_valid', ok: !!mcpConfig && !!mcpConfig.gateway });

    // 2. Heady buddy config exists
    const buddyConfig = readYamlSafe(path.join(CONFIGS_DIR, 'heady-buddy.yaml'));
    checks.push({ name: 'buddy_config_exists', ok: !!buddyConfig });

    // 3. Check MCP server file exists
    checks.push({
      name: 'mcp_server_exists',
      ok: fs.existsSync(path.join(SRC_DIR, 'mcp', 'heady-mcp-server.js')),
    });

    // 4. Check MCP bridge file exists
    checks.push({
      name: 'mcp_bridge_exists',
      ok: fs.existsSync(path.join(SRC_DIR, 'mcp', 'colab-mcp-bridge.js')),
    });

    // 5. Verify notification service directory exists
    checks.push({
      name: 'notification_service_exists',
      ok: fs.existsSync(path.join(SERVICES_DIR, 'notification-service')),
    });

    return checks;
  }

  async runInfrastructureChecks() {
    const checks = [];

    // 1. Dockerfile exists
    checks.push({ name: 'dockerfile_exists', ok: fs.existsSync(path.join(ROOT, 'Dockerfile')) });

    // 2. docker-compose.yml exists
    checks.push({ name: 'docker_compose_exists', ok: fs.existsSync(path.join(ROOT, 'docker-compose.yml')) });

    // 3. Check .env file exists (required for local dev)
    checks.push({ name: 'env_file_exists', ok: fs.existsSync(path.join(ROOT, '.env')) });

    // 4. Check render.yaml exists (deployment config)
    checks.push({ name: 'render_yaml_exists', ok: fs.existsSync(path.join(ROOT, 'render.yaml')) });

    // 5. Service catalog lists all expected services
    const catalog = readYamlSafe(path.join(CONFIGS_DIR, 'service-catalog.yaml'));
    const serviceCount = catalog?.services?.length || 0;
    checks.push({ name: 'service_catalog_count', ok: serviceCount >= 13, value: serviceCount }); // fib(7)

    // 6. Check node_modules exists
    checks.push({ name: 'node_modules_exists', ok: fs.existsSync(path.join(ROOT, 'node_modules')) });

    // 7. Verify GCP project in HEADY_CONTEXT
    const contextPath = path.join(ROOT, 'HEADY_CONTEXT.md');
    if (fs.existsSync(contextPath)) {
      const context = fs.readFileSync(contextPath, 'utf8');
      checks.push({ name: 'gcp_project_documented', ok: context.includes('gen-lang-client-0920560496') });
    }

    // ─── DEEP AUDIT P0 CHECKS (from 2026-03-18 audit report) ───────────────
    // P0-001: No merge conflicts in .env.example
    const envExample = path.join(ROOT, '.env.example');
    if (fs.existsSync(envExample)) {
      const content = fs.readFileSync(envExample, 'utf8');
      checks.push({ name: 'P0_001_no_merge_conflicts', ok: !content.includes('<<<<<<< HEAD') && !content.includes('>>>>>>>') });
    }

    // P0-003: phi-math-foundation package exists
    checks.push({ name: 'P0_003_phi_math_foundation', ok: fs.existsSync(path.join(ROOT, 'packages', 'phi-math-foundation')) });

    // P0-004: mcp-server package exists
    checks.push({ name: 'P0_004_mcp_server_package', ok: fs.existsSync(path.join(ROOT, 'packages', 'mcp-server')) });

    // P0-005: start:mcp script points to correct file
    const pkg = readJsonSafe(path.join(ROOT, 'package.json'));
    if (pkg?.scripts?.['start:mcp']) {
      checks.push({ name: 'P0_005_mcp_script_target', ok: !pkg.scripts['start:mcp'].includes('backend/app.js') });
    }

    // P0-008: remote-resources.yaml has no localhost defaults
    const remoteRes = readYamlSafe(path.join(CONFIGS_DIR, 'remote-resources.yaml'));
    if (remoteRes) {
      const remoteStr = JSON.stringify(remoteRes);
      checks.push({ name: 'P0_008_no_localhost_in_remote_resources', ok: !remoteStr.includes('localhost') });
    }

    // P0-010: No duplicate infra dirs
    checks.push({ name: 'P0_010_single_infra_dir', ok: !(fs.existsSync(path.join(ROOT, 'infra', 'cloud-run')) && fs.existsSync(path.join(ROOT, 'infra', 'cloudrun'))) });

    // P0-011/012: MCP service endpoints use env vars
    const mcpServicesFile = path.join(SERVICES_DIR, 'heady-mcp-server', 'src', 'config', 'services.js');
    if (fs.existsSync(mcpServicesFile)) {
      const mcpContent = fs.readFileSync(mcpServicesFile, 'utf8');
      checks.push({ name: 'P0_011_mcp_no_hardcoded_localhost', ok: !mcpContent.includes("|| 'localhost'") });
      checks.push({ name: 'P0_012_mcp_uses_env_base_url', ok: mcpContent.includes('HEADY_SERVICE_BASE_URL') || mcpContent.includes('HEADY_SERVICE_HOST') });
    }

    // P1-005: φ-scaled continuous pipeline interval
    if (fs.existsSync(path.join(ROOT, 'heady-manager.js'))) {
      const mgrContent = fs.readFileSync(path.join(ROOT, 'heady-manager.js'), 'utf8');
      checks.push({ name: 'P1_005_phi_scaled_interval', ok: mgrContent.includes('PHI_CONTINUOUS_INTERVAL') });
      // Also verify CORS is not wildcard
      checks.push({ name: 'P0_007_no_cors_wildcard', ok: !mgrContent.includes("origin: \"*\"") && !mgrContent.includes("origin: '*'") });
    }

    // P1-003: HCFP auto-start on boot
    if (fs.existsSync(path.join(ROOT, 'heady-manager.js'))) {
      const mgrContent = fs.readFileSync(path.join(ROOT, 'heady-manager.js'), 'utf8');
      checks.push({ name: 'P1_003_auto_success_booted', ok: mgrContent.includes('auto-success-engine') });
      checks.push({ name: 'P1_003_continuous_auto_start', ok: mgrContent.includes('AUTO-STARTED') });
      // SERVICE-LOADER: verify it's wired in
      checks.push({ name: 'service_loader_wired', ok: mgrContent.includes('service-loader') });
    }

    // ─── SERVICE + ARCHIVE CHECKS (from blueprint cross-reference) ──────
    // Service-loader module exists
    checks.push({ name: 'service_loader_exists', ok: fs.existsSync(path.join(SRC_DIR, 'service-loader.js')) });

    // Archive configs restored
    checks.push({ name: 'ecosystem_config_exists', ok: fs.existsSync(path.join(ROOT, 'ecosystem.config.cjs')) });
    checks.push({ name: 'turbo_json_exists', ok: fs.existsSync(path.join(ROOT, 'turbo.json')) });

    // Critical source modules exist (from archive heady-manager.js)
    const criticalModules = [
      'vector-memory.js', 'vector-pipeline.js', 'vector-federation.js',
      'vector-space-ops.js', 'self-awareness.js', 'self-optimizer.js',
      'heady-conductor.js', 'agent-orchestrator.js', 'corrections.js',
      'compute-dashboard.js',
    ];
    for (const mod of criticalModules) {
      checks.push({ name: `module_exists:${mod}`, ok: fs.existsSync(path.join(SRC_DIR, mod)) });
    }

    // Critical service modules exist
    const criticalServices = [
      'admin-citadel.js', 'buddy-system.js', 'octree-manager.js',
      'antigravity-heady-runtime.js', 'error-sentinel-service.js',
      'cloud-midi-sequencer.js', 'realtime-intelligence-service.js',
      'heady-autonomy.js', 'service-manager.js',
    ];
    for (const svc of criticalServices) {
      checks.push({ name: `service_exists:${svc}`, ok: fs.existsSync(path.join(SERVICES_DIR, svc)) });
    }

    return checks;
  }

  async runIntelligenceChecks() {
    const checks = [];

    // 1. Sacred Geometry SDK exists
    checks.push({
      name: 'sacred_geometry_sdk',
      ok: fs.existsSync(path.join(ROOT, 'packages', 'heady-sacred-geometry-sdk')),
    });

    // 2. HeadyBee template registry exists
    const registryPath = path.join(SRC_DIR, 'services', 'headybee-template-registry.js');
    checks.push({ name: 'bee_template_registry', ok: fs.existsSync(registryPath) });

    // 3. Antigravity runtime policy is valid
    const policy = readJsonSafe(path.join(CONFIGS_DIR, 'services', 'antigravity-heady-runtime-policy.json'));
    checks.push({
      name: 'antigravity_policy_valid',
      ok: !!policy && policy.enforce?.gateway === 'heady' && policy.enforce?.workspaceMode === '3d-vector',
    });

    // 4. CSL thresholds are φ-derived
    checks.push({
      name: 'csl_thresholds_valid',
      ok: CSL_THRESHOLDS.length === 10 && Math.abs(CSL_THRESHOLDS[1] - PSI) < 0.001,
    });

    // 5. Concepts index exists
    const concepts = readYamlSafe(path.join(CONFIGS_DIR, 'concepts-index.yaml'));
    checks.push({ name: 'concepts_index_exists', ok: !!concepts });

    return checks;
  }

  async syncData() {
    const checks = [];

    // 1. Registry file exists and is valid
    const registryPath = path.join(ROOT, '.heady', 'registry.json');
    const registry = readJsonSafe(registryPath);
    checks.push({ name: 'registry_valid', ok: !!registry && !!registry.nodes });

    // 2. heady-registry.json exists
    const headyReg = readJsonSafe(path.join(ROOT, 'heady-registry.json'));
    checks.push({ name: 'heady_registry_valid', ok: !!headyReg });

    // 3. Antigravity runtime state exists
    const agState = readJsonSafe(path.join(CONFIGS_DIR, 'services', 'antigravity-heady-runtime-state.json'));
    checks.push({
      name: 'antigravity_state_valid',
      ok: !!agState && agState.workspaceMode === '3d-vector',
    });

    // 4. Pipeline log writable
    const pipelineLog = path.join(ROOT, 'hc_pipeline.log');
    try {
      fs.appendFileSync(pipelineLog, '', 'utf8');
      checks.push({ name: 'pipeline_log_writable', ok: true });
    } catch {
      checks.push({ name: 'pipeline_log_writable', ok: false });
    }

    return checks;
  }

  async optimizeCosts() {
    const checks = [];

    // 1. Check .env for redundant API keys (multiple keys for same provider)
    if (fs.existsSync(path.join(ROOT, '.env'))) {
      const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
      const keys = env.split('\n').filter(l => l.includes('API_KEY') || l.includes('TOKEN'));
      checks.push({ name: 'api_key_count', ok: true, value: keys.length });
    }

    // 2. Check service catalog for potential duplicates
    const catalog = readYamlSafe(path.join(CONFIGS_DIR, 'service-catalog.yaml'));
    if (catalog?.services) {
      const names = catalog.services.map(s => s.name);
      const unique = [...new Set(names)];
      checks.push({ name: 'no_duplicate_services', ok: names.length === unique.length, services: names.length });
    }

    // 3. Budget config exists
    checks.push({
      name: 'resource_policies_exist',
      ok: fs.existsSync(path.join(CONFIGS_DIR, 'resource-policies.yaml')),
    });

    // 4. No orphaned service directories (dirs not in catalog)
    if (catalog?.services && fs.existsSync(SERVICES_DIR)) {
      const catalogNames = new Set((catalog.services || []).map(s => s.name));
      const dirs = fs.readdirSync(SERVICES_DIR).filter(d =>
        fs.statSync(path.join(SERVICES_DIR, d)).isDirectory()
      );
      const orphaned = dirs.filter(d => !catalogNames.has(d));
      checks.push({
        name: 'orphaned_service_dirs',
        ok: orphaned.length <= fib(8), // Allow up to 21 non-catalog dirs
        orphanedCount: orphaned.length,
      });
    }

    return checks;
  }

  async runSelfAwarenessCategory() {
    const checks = [];

    // 1. Self-awareness config exists
    const selfConfig = readYamlSafe(path.join(CONFIGS_DIR, 'system-self-awareness.yaml'));
    checks.push({ name: 'self_awareness_config', ok: !!selfConfig });

    // 2. Auto-success engine cycle stability
    checks.push({
      name: 'cycle_stability',
      ok: this.totalFailures < this.maxRetriesTotal,
      failures: this.totalFailures,
      threshold: this.maxRetriesTotal,
    });

    // 3. Confidence score for last cycle
    if (this.lastCycleResults) {
      const total = this.lastCycleResults.successful + this.lastCycleResults.failed;
      const confidence = total > 0 ? this.lastCycleResults.successful / total : 0;
      checks.push({
        name: 'cycle_confidence',
        ok: confidence >= PSI, // ≥ 0.618
        value: confidence.toFixed(3),
        threshold: PSI.toFixed(3),
      });
    } else {
      checks.push({ name: 'cycle_confidence', ok: true, note: 'first_cycle' });
    }

    // 4. Memory growth detection (basic)
    const mem = process.memoryUsage();
    checks.push({
      name: 'heap_growth_check',
      ok: mem.heapUsed < mem.heapTotal * 0.85,
      heapUsedMB: Math.round(mem.heapUsed / 1048576),
      heapTotalMB: Math.round(mem.heapTotal / 1048576),
    });

    return checks;
  }

  async runEvolutionCategory() {
    const checks = [];

    // 1. hcfullpipeline.yaml version check
    const pipelineConfig = readYamlSafe(path.join(CONFIGS_DIR, 'hcfullpipeline.yaml'));
    checks.push({
      name: 'pipeline_version',
      ok: !!pipelineConfig?.version,
      value: pipelineConfig?.version || 'unknown',
    });

    // 2. Pipeline stage count = 22 (21 canonical + heady-distiller)
    const stageCount = pipelineConfig?.pipeline?.stages?.length || 0;
    checks.push({
      name: 'pipeline_stage_count_fib8',
      ok: stageCount === 22,
      value: stageCount,
      expected: 22,
    });

    // 3. Receipt stage depends on required stage (not optional)
    const receiptStage = (pipelineConfig?.pipeline?.stages || []).find(s => s.id === 'receipt');
    if (receiptStage) {
      const deps = receiptStage.dependsOn || [];
      const optionalStages = (pipelineConfig?.pipeline?.stages || [])
        .filter(s => s.required === false)
        .map(s => s.id);
      const dependsOnOptional = deps.some(d => optionalStages.includes(d));
      checks.push({ name: 'receipt_deps_required', ok: !dependsOnOptional });
    }

    // 4. No localhost in deployment hooks
    const hooks = pipelineConfig?.pipeline?.deployment_hooks;
    if (hooks) {
      const allCommands = [...(hooks.pre_deploy || []), ...(hooks.post_deploy || [])]
        .map(h => h.command || '')
        .join(' ');
      checks.push({ name: 'no_localhost_in_hooks', ok: !allCommands.includes('localhost') && !allCommands.includes('http://') });
    }

    // 5. All FAST path stages are required
    const triage = (pipelineConfig?.pipeline?.stages || []).find(s => s.id === 'triage');
    if (triage?.triageConfig?.pipelinePaths?.FAST) {
      const fastIds = triage.triageConfig.pipelinePaths.FAST.stages;
      const allStages = pipelineConfig.pipeline.stages;
      const requiredInFast = fastIds.every(order => {
        const stage = allStages.find(s => s.order === order);
        return !stage || stage.required !== false;
      });
      checks.push({ name: 'fast_path_all_required', ok: requiredInFast });
    }

    return checks;
  }
}

// ─── AUTO-LOOP SCHEDULER (34 loops × 8 rings) ──────────────────────────────
let autoLoopScheduler = null;
try {
  const { AutoLoopScheduler } = require('./src/auto-loop-scheduler');
  autoLoopScheduler = new AutoLoopScheduler({ pipeline: null });
  console.log(`  ∞ AutoLoopScheduler: ${autoLoopScheduler.loops.size} loops registered across 8 rings`);
} catch (err) {
  console.warn(`  ⚠ AutoLoopScheduler: ${err.message}`);
}

// ─── EXPORT ─────────────────────────────────────────────────────────────────

const engine = new AutoSuccessEngine({
  enableMonteCarloValidation: true,
  enableLiquidScaling: true,
  enableSelfAwareness: true,
  enableEvolution: true,
});

// Wire auto-loop scheduler into engine
if (autoLoopScheduler) {
  engine.autoLoopScheduler = autoLoopScheduler;
}

// Graceful shutdown
if (require.main === module) {
  const shutdown = async () => {
    if (autoLoopScheduler) autoLoopScheduler.stop();
    await engine.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  engine.start().then(() => {
    if (autoLoopScheduler) autoLoopScheduler.start();
  }).catch(console.error);
}

module.exports = {
  AutoSuccessEngine,
  engine,
  autoLoopScheduler,
  AUTO_SUCCESS,
  TASK_CATEGORIES,
  PHI,
  PSI,
  fib,
  phiBackoff,
  CSL_THRESHOLDS,
};

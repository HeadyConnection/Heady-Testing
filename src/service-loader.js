// HEADY_BRAND:BEGIN
// ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces
// FILE: src/service-loader.js
// LAYER: core/bootstrap
// PURPOSE: Microservice discovery and loading — keeps heady-manager thin
// HEADY_BRAND:END

'use strict';

const fs = require('fs');
const path = require('path');

const PHI = 1.618033988749895;

/**
 * ServiceLoader — Discovers and loads all Heady services into the Express app.
 * Follows the microservice pattern: each service is a self-contained module
 * with its own routes, lifecycle, and error handling.
 * 
 * heady-manager.js just calls: serviceLoader.loadAll(app, deps)
 * No god classes. Each service registers its own routes.
 */
class ServiceLoader {
  constructor() {
    this.loaded = [];
    this.failed = [];
    this.skipped = [];
  }

  /**
   * Attempt to load a single service. Catches errors gracefully.
   * @param {string} name — Human-readable name
   * @param {Function} loader — Function that performs the load
   * @returns {boolean} — true if loaded
   */
  _tryLoad(name, loader) {
    try {
      loader();
      this.loaded.push(name);
      console.log(`  ∞ ${name}: LOADED`);
      return true;
    } catch (err) {
      this.failed.push({ name, error: err.message });
      console.warn(`  ⚠ ${name}: ${err.message}`);
      return false;
    }
  }

  /**
   * Load all services into the Express app.
   * @param {Express.Application} app
   * @param {Object} deps — shared dependencies (secretsManager, vectorMemory, etc.)
   */
  loadAll(app, deps = {}) {
    const ROOT = path.resolve(__dirname, '..');
    const SRC = __dirname;

    // ─── Security & Lifecycle ─────────────────────────────────────────
    this._tryLoad('RequestIdTracing', () => {
      const { requestId } = require('./middleware/request-id');
      app.use(requestId());
    });

    this._tryLoad('GracefulShutdown', () => {
      const { installShutdownHooks } = require('./lifecycle/graceful-shutdown');
      installShutdownHooks();
    });

    this._tryLoad('CodeGovernance', () => {
      const codeGovernance = require('./security/code-governance');
      codeGovernance.loadConfig();
      codeGovernance.registerRoutes(app);
    });

    // ─── Vector Intelligence Layer ────────────────────────────────────
    let vectorMemory = deps.vectorMemory || null;
    this._tryLoad('VectorMemory', () => {
      vectorMemory = require('./vector-memory');
      vectorMemory.init();
      vectorMemory.registerRoutes(app);
    });

    this._tryLoad('VectorPipeline', () => {
      if (!vectorMemory) return;
      const vectorPipeline = require('./vector-pipeline');
      app.use(vectorPipeline.createVectorAugmentedMiddleware(vectorMemory));
      vectorPipeline.registerRoutes(app, vectorMemory);
    });

    this._tryLoad('VectorFederation', () => {
      const vectorFederation = require('./vector-federation');
      vectorFederation.registerRoutes(app);
    });

    this._tryLoad('VectorSpaceOps', () => {
      if (!vectorMemory) return;
      const { VectorSpaceOps } = require('./vector-space-ops');
      const ops = new VectorSpaceOps(vectorMemory);
      ops.registerRoutes(app);
      ops.start();
    });

    // ─── Self-Awareness & Self-Optimization ───────────────────────────
    this._tryLoad('SelfAwareness', () => {
      const sa = require('./self-awareness');
      sa.startSelfAwareness();
    });

    this._tryLoad('SelfOptimizer', () => {
      const so = require('./self-optimizer');
      so.registerRoutes(app, vectorMemory);
    });

    // ─── Resilience Layer ─────────────────────────────────────────────
    this._tryLoad('AutoHeal', () => {
      const { AutoHeal } = require('./resilience/auto-heal');
      const autoHeal = new AutoHeal(deps.conductor || null);
      // φ-scaled check interval: φ⁵ × 1000 ≈ 11,090ms (was 5min=300,000ms)
      const healInterval = Math.round(Math.pow(PHI, 5) * 1000);
      setInterval(() => autoHeal.check(), healInterval);
      autoHeal.check(); // Initial check
    });

    this._tryLoad('SecretRotation', () => {
      const { SecretRotation } = require('./security/secret-rotation');
      const sr = new SecretRotation();
      const audit = sr.audit();
      console.log(`    → Secret Rotation Score: ${audit.score}`);
      // Daily audit (scaled: fib(11)=89 × 1000s ≈ 24.7h)
      setInterval(() => sr.audit(), 89 * 1000 * 1000);
    });

    // ─── Services Layer (each self-contained) ─────────────────────────
    const serviceModules = [
      { name: 'AntigravityRuntime', path: './services/antigravity-heady-runtime', routes: true, routePrefix: null },
      { name: 'BuddyChatContract', path: './services/buddy-chat-contract', routes: 'custom' },
      { name: 'BuddySystem', path: './services/buddy-system', routes: true },
      { name: 'OctreeManager', path: './services/octree-manager', routes: true },
      { name: 'RedisSyncBridge', path: './services/redis-sync-bridge', routes: true },
      { name: 'AdminCitadel', path: './services/admin-citadel', routes: true },
      { name: 'ErrorSentinel', path: './services/error-sentinel-service', routes: true },
      { name: 'CloudMIDI', path: './services/cloud-midi-sequencer', routes: true },
      { name: 'DawMcpBridge', path: './services/daw-mcp-bridge', routes: true },
      { name: 'RealtimeIntelligence', path: './services/realtime-intelligence-service', routes: true },
      { name: 'HeadyAutonomy', path: './services/heady-autonomy', routes: true },
      { name: 'ServiceManager', path: './services/service-manager', routes: true },
      { name: 'DynamicConnector', path: './services/dynamic-connector-service', routes: true },
      { name: 'SpatialEmbedder', path: './services/spatial-embedder', routes: true },
      { name: 'DigitalPresence', path: './services/digital-presence-orchestrator', routes: 'register' },
      { name: 'UnifiedAutonomy', path: './services/unified-enterprise-autonomy', routes: 'register' },
      { name: 'UnifiedLiquidSystem', path: './services/unified-liquid-system', routes: 'register' },
      { name: 'LiquidUnifiedRuntime', path: './services/liquid-unified-runtime', routes: 'register' },
      { name: 'OnboardingOrchestrator', path: './services/onboarding-orchestrator', routes: 'register' },
    ];

    for (const svc of serviceModules) {
      this._tryLoad(svc.name, () => {
        const mod = require(svc.path);
        if (svc.routes === 'register') {
          // Pattern: { registerXxxRoutes } = require(...)
          const registerFn = Object.values(mod).find(v => typeof v === 'function' && v.name.startsWith('register'));
          if (registerFn) registerFn(app);
        } else if (svc.routes === 'custom') {
          // BuddyChatContract has custom route setup
          if (mod.buildChatRequest) {
            app.post('/api/buddy-chat/request', (req, res) => {
              try { res.json({ ok: true, ...mod.buildChatRequest(req.body) }); }
              catch (err) { res.status(400).json({ ok: false, error: err.message }); }
            });
            app.post('/api/buddy-chat/workspace', (req, res) => {
              res.json({ ok: true, workspaceId: mod.buildUserWorkspaceId(req.body) });
            });
          }
        } else if (svc.routes) {
          if (mod.registerRoutes) mod.registerRoutes(app);
          else if (mod.register) mod.register(app);
          else {
            const regFn = Object.values(mod).find(v => typeof v === 'function' && /[Rr]oute/.test(v.name));
            if (regFn) regFn(app);
          }
        }
      });
    }

    // ─── Bee Swarm Discovery ──────────────────────────────────────────
    this._tryLoad('BeeSwarm', () => {
      const beeRegistry = require('./bees/registry');
      const beeCount = beeRegistry.discover();
      console.log(`    → ${beeCount} bees discovered`);
    });

    // ─── HeadyConductor — Federated Routing ───────────────────────────
    let conductor = deps.conductor || null;
    this._tryLoad('HeadyConductor', () => {
      const { getConductor } = require('./heady-conductor');
      conductor = getConductor();
      if (deps.orchestrator) conductor.setOrchestrator(deps.orchestrator);
      if (vectorMemory) conductor.setVectorMemory(vectorMemory);
      conductor.registerRoutes(app);
    });

    // ─── Agent Orchestrator ───────────────────────────────────────────
    this._tryLoad('AgentOrchestrator', () => {
      const { getOrchestrator } = require('./agent-orchestrator');
      const orchestrator = getOrchestrator({
        baseUrl: process.env.HEADY_MANAGER_URL || 'https://manager.headysystems.com',
        apiKey: process.env.HEADY_API_KEY,
      });
      orchestrator.registerRoutes(app);
      if (vectorMemory) orchestrator.setVectorMemory(vectorMemory);
      deps.orchestrator = orchestrator;
    });

    // ─── Corrections Engine ───────────────────────────────────────────
    this._tryLoad('HeadyCorrections', () => {
      const corrections = require('./corrections');
      corrections.init();
      corrections.registerRoutes(app);
    });

    // ─── Compute Dashboard ────────────────────────────────────────────
    this._tryLoad('ComputeDashboard', () => {
      const dashboard = require('./compute-dashboard');
      dashboard.registerRoutes(app, deps.orchestrator);
    });

    // ─── HeadyBee Template Registry ───────────────────────────────────
    this._tryLoad('HeadybeeTemplateRegistry', () => {
      const { registerHeadybeeTemplateRegistryRoutes } = require('./services/headybee-template-registry');
      registerHeadybeeTemplateRegistryRoutes(app);
    });

    return this.getReport();
  }

  /** @returns {{ loaded: string[], failed: {name:string,error:string}[], total: number }} */
  getReport() {
    return {
      loaded: this.loaded,
      failed: this.failed,
      skipped: this.skipped,
      total: this.loaded.length + this.failed.length,
      healthy: this.loaded.length,
      degraded: this.failed.length,
    };
  }
}

module.exports = { ServiceLoader };

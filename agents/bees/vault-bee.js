// HEADY_BRAND:BEGIN
// ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces
// FILE: agents/bees/vault-bee.js
// LAYER: agents/bees
// PURPOSE: JIT secret injection bee — HeadyBee template, sentinel swarm
// HEADY_BRAND:END

'use strict';

const crypto = require('crypto');

// ─── PHI CONSTANTS ──────────────────────────────────────────────────────────
const PHI = 1.618033988749895;
const PSI = 1 / PHI;
const PHI_3_MS = Math.round(Math.pow(PHI, 3) * 1000); // 4,236ms cleanup timer

/**
 * VaultBee — JIT Secret Injection Bee
 *
 * HeadyBee template: implements sting(), health(), describe().
 * Sentinel swarm singleton — one VaultBee per runtime.
 *
 * Three injection formats:
 *   - raw:    plain string value
 *   - header: { Authorization: 'Bearer <secret>' }
 *   - env:    injects into process.env, auto-cleans after φ³ms
 *
 * Auto-cleanup: secrets wiped from process.env after φ³ms (4,236ms).
 * No secrets are stored on disk — vault-bee is a pass-through injector.
 */
class VaultBee {
  constructor(options = {}) {
    this.type = 'vault-bee';
    this.swarm = 'Sentinel';
    this.priority = 'critical';
    this.cleanupTimers = new Map();
    this.injectionCount = 0;
    this.lastInjection = null;
    this.cleanupDelayMs = options.cleanupDelayMs || PHI_3_MS;
  }

  // ─── HeadyBee Template: sting() ──────────────────────────────────────────
  /**
   * Inject a secret JIT style.
   * @param {Object} params
   * @param {string} params.key   - Secret name (e.g., 'STRIPE_SECRET_KEY')
   * @param {string} params.value - Secret value
   * @param {string} params.format - 'raw' | 'header' | 'env'
   * @returns {Object} Injection result
   */
  async sting({ key, value, format = 'raw' }) {
    if (!key || !value) {
      return { ok: false, error: 'key and value are required' };
    }

    this.injectionCount++;
    this.lastInjection = new Date().toISOString();

    const injectionId = crypto.randomUUID();

    switch (format) {
      case 'raw':
        return { ok: true, injectionId, format: 'raw', key, value };

      case 'header':
        return {
          ok: true,
          injectionId,
          format: 'header',
          key,
          header: { Authorization: `Bearer ${value}` },
        };

      case 'env':
        process.env[key] = value;
        // Auto-cleanup after φ³ms
        const timer = setTimeout(() => {
          delete process.env[key];
          this.cleanupTimers.delete(injectionId);
        }, this.cleanupDelayMs);
        timer.unref(); // Don't keep process alive for cleanup
        this.cleanupTimers.set(injectionId, timer);
        return {
          ok: true,
          injectionId,
          format: 'env',
          key,
          autoCleanupMs: this.cleanupDelayMs,
        };

      default:
        return { ok: false, error: `Unknown format: ${format}` };
    }
  }

  // ─── HeadyBee Template: health() ─────────────────────────────────────────
  health() {
    return {
      ok: true,
      type: this.type,
      swarm: this.swarm,
      injectionCount: this.injectionCount,
      activeCleanupTimers: this.cleanupTimers.size,
      lastInjection: this.lastInjection,
      cleanupDelayMs: this.cleanupDelayMs,
    };
  }

  // ─── HeadyBee Template: describe() ───────────────────────────────────────
  describe() {
    return {
      type: this.type,
      swarm: this.swarm,
      priority: this.priority,
      purpose: 'JIT secret injection — pass-through, no persistence, auto-cleanup',
      formats: ['raw', 'header', 'env'],
      autoCleanupMs: this.cleanupDelayMs,
      endpoints: [
        'POST /api/vault-bee/inject  { key, value, format }',
        'GET  /api/vault-bee/health',
        'GET  /api/vault-bee/describe',
      ],
    };
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  destroy() {
    for (const [id, timer] of this.cleanupTimers) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
  }
}

// Singleton
const vaultBee = new VaultBee();

module.exports = { VaultBee, vaultBee };

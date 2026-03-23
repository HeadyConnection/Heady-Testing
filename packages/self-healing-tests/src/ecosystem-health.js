/**
 * © 2026 Heady™Systems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * ─── Ecosystem Health Score Aggregator ────────────────────────────────────────
 *
 * Unified health score aggregator that collects self-healing test results from
 * all repos and computes ecosystem-wide metrics. Reads .heady/reports/ across
 * every repo, computes per-repo and aggregate health scores using φ-math, and
 * tracks trends over time (improving / declining / stable).
 *
 * Outputs a dashboard-ready JSON summary suitable for the Sacred Geometry UI.
 *
 * Uses φ-scaled weighting throughout (PHI = 1.618033988749895).
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — Sacred Geometry & Fibonacci
// ─────────────────────────────────────────────────────────────────────────────

const PHI = 1.618033988749895;
const PSI = 1 / PHI;               // 0.6180339887…
const PSI2 = PSI * PSI;            // 0.3819660113…

/**
 * Health tiers mapped to φ-derived thresholds.
 *
 *   OPTIMAL  — score ≥ PSI + PSI² ≈ 1.0   (golden perfection)
 *   HEALTHY  — score ≥ 1 - PSI²  ≈ 0.618  (golden ratio)
 *   DEGRADED — score ≥ PSI²      ≈ 0.382  (critical threshold)
 *   CRITICAL — score < PSI²               (below critical)
 */
const HEALTH_TIERS = {
  OPTIMAL:  { min: PSI + PSI2, label: 'Optimal' },
  HEALTHY:  { min: 1 - PSI2,   label: 'Healthy' },
  DEGRADED: { min: PSI2,       label: 'Degraded' },
  CRITICAL: { min: 0,          label: 'Critical' },
};

// Fibonacci sequence used for trend window sizes
const FIB = [1, 1, 2, 3, 5, 8, 13, 21];

// Minimum number of historical reports needed to detect a trend
const TREND_WINDOW = FIB[5]; // 8

// Trend labels
const TREND = {
  IMPROVING: 'improving',
  DECLINING: 'declining',
  STABLE:    'stable',
  UNKNOWN:   'unknown',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify a numeric health score into a tier.
 */
function classifyTier(score) {
  if (score >= HEALTH_TIERS.OPTIMAL.min) return HEALTH_TIERS.OPTIMAL.label;
  if (score >= HEALTH_TIERS.HEALTHY.min) return HEALTH_TIERS.HEALTHY.label;
  if (score >= HEALTH_TIERS.DEGRADED.min) return HEALTH_TIERS.DEGRADED.label;
  return HEALTH_TIERS.CRITICAL.label;
}

/**
 * Clamp a value between 0 and 1.
 */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Compute the φ-weighted mean of an array of values.
 * Each successive value receives PHI^(-i) weight, giving recent / higher-ranked
 * entries exponentially more influence along the golden ratio.
 */
function phiWeightedMean(values) {
  if (!values.length) return 0;
  let weightSum = 0;
  let valueSum = 0;
  for (let i = 0; i < values.length; i++) {
    const w = Math.pow(PSI, i); // PHI^(-i) = PSI^i
    weightSum += w;
    valueSum += values[i] * w;
  }
  return valueSum / weightSum;
}

/**
 * Safe JSON parse — returns null on failure.
 */
function safeParseJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ECOSYSTEM HEALTH CLASS
// ─────────────────────────────────────────────────────────────────────────────

class EcosystemHealth {
  /**
   * @param {string} reposDir — Parent directory containing all repo checkouts.
   *   Each child directory may contain a .heady/reports/ folder with JSON reports.
   */
  constructor(reposDir) {
    this.reposDir = path.resolve(reposDir);
    this._cache = null;
  }

  // ─── COLLECT ────────────────────────────────────────────────────────────────

  /**
   * Scan all repos for .heady/reports/*.json files.
   * Returns a Map<repoName, reportObject[]> sorted newest-first per repo.
   */
  collectReports() {
    const reportsMap = new Map();

    let entries;
    try {
      entries = fs.readdirSync(this.reposDir, { withFileTypes: true });
    } catch (err) {
      return reportsMap; // directory unreadable — return empty
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const reportsDir = path.join(this.reposDir, entry.name, '.heady', 'reports');
      if (!fs.existsSync(reportsDir)) continue;

      let files;
      try {
        files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
      } catch (_) {
        continue;
      }

      const reports = [];
      for (const file of files) {
        const data = safeParseJSON(path.join(reportsDir, file));
        if (data) {
          // Ensure a timestamp for sorting
          if (!data.timestamp) {
            try {
              const stat = fs.statSync(path.join(reportsDir, file));
              data.timestamp = stat.mtimeMs;
            } catch (_) {
              data.timestamp = 0;
            }
          } else if (typeof data.timestamp === 'string') {
            data.timestamp = new Date(data.timestamp).getTime();
          }
          data._file = file;
          reports.push(data);
        }
      }

      // Newest first
      reports.sort((a, b) => b.timestamp - a.timestamp);

      if (reports.length) {
        reportsMap.set(entry.name, reports);
      }
    }

    return reportsMap;
  }

  // ─── PER-REPO HEALTH ───────────────────────────────────────────────────────

  /**
   * Compute per-repo health from a list of reports (newest-first).
   *
   * Health score is derived from the latest report's metrics using φ-weights:
   *   - passRate          × PHI²   (most important — tests passing)
   *   - healSuccessRate   × PHI    (self-healing effectiveness)
   *   - stabilityRate     × 1      (baseline weight)
   *
   * All sub-scores are normalised to [0, 1] and combined via weighted average.
   *
   * @param {object[]} reports — Array of report objects, newest first.
   * @returns {{ score: number, tier: string, metrics: object }}
   */
  computeRepoHealth(reports) {
    if (!reports || !reports.length) {
      return { score: 0, tier: HEALTH_TIERS.CRITICAL.label, metrics: {} };
    }

    const latest = reports[0];

    // Extract core metrics with safe defaults
    const totalTests = latest.totalTests || latest.total || 0;
    const passed = latest.passed || latest.passCount || 0;
    const healed = latest.healed || latest.healCount || 0;
    const failed = latest.failed || latest.failCount || 0;
    const healAttempts = latest.healAttempts || latest.healCycles || healed + failed;

    const passRate = totalTests > 0 ? passed / totalTests : 0;
    const healSuccessRate = healAttempts > 0 ? healed / healAttempts : 1;
    const stabilityRate = totalTests > 0 ? 1 - (failed / totalTests) : 0;

    // φ-weighted combination
    const PHI2 = PHI * PHI; // ≈ 2.618
    const weights = {
      passRate: PHI2,
      healSuccessRate: PHI,
      stabilityRate: 1,
    };
    const totalWeight = weights.passRate + weights.healSuccessRate + weights.stabilityRate;

    const raw = (
      clamp01(passRate) * weights.passRate +
      clamp01(healSuccessRate) * weights.healSuccessRate +
      clamp01(stabilityRate) * weights.stabilityRate
    ) / totalWeight;

    const score = clamp01(raw);
    const tier = classifyTier(score);

    return {
      score,
      tier,
      metrics: {
        passRate: clamp01(passRate),
        healSuccessRate: clamp01(healSuccessRate),
        stabilityRate: clamp01(stabilityRate),
        totalTests,
        passed,
        healed,
        failed,
        reportCount: reports.length,
        latestReport: latest._file || null,
        latestTimestamp: latest.timestamp || null,
      },
    };
  }

  // ─── ECOSYSTEM HEALTH ──────────────────────────────────────────────────────

  /**
   * Compute ecosystem-wide health from a Map<repoName, repoHealth>.
   *
   * Uses a φ-weighted average where repos are sorted by health (lowest first)
   * so the weakest repos receive the highest weight — the ecosystem is only as
   * strong as its weakest link, amplified by the golden ratio.
   *
   * @param {Map<string, { score: number, tier: string, metrics: object }>} repoHealths
   * @returns {{ score: number, tier: string, repoCount: number, distribution: object }}
   */
  computeEcosystemHealth(repoHealths) {
    if (!repoHealths || !repoHealths.size) {
      return {
        score: 0,
        tier: HEALTH_TIERS.CRITICAL.label,
        repoCount: 0,
        distribution: { Optimal: 0, Healthy: 0, Degraded: 0, Critical: 0 },
      };
    }

    // Sort scores ascending so φ-weighting emphasises weakest repos
    const entries = Array.from(repoHealths.entries());
    entries.sort((a, b) => a[1].score - b[1].score);

    const scores = entries.map(e => e[1].score);
    const ecosystemScore = clamp01(phiWeightedMean(scores));
    const tier = classifyTier(ecosystemScore);

    // Distribution counts
    const distribution = { Optimal: 0, Healthy: 0, Degraded: 0, Critical: 0 };
    for (const [, health] of entries) {
      distribution[health.tier] = (distribution[health.tier] || 0) + 1;
    }

    return {
      score: ecosystemScore,
      tier,
      repoCount: entries.length,
      distribution,
    };
  }

  // ─── TREND DETECTION ───────────────────────────────────────────────────────

  /**
   * Detect trends across historical reports for a single repo.
   *
   * Compares the φ-weighted mean of the most recent TREND_WINDOW / PHI reports
   * against the oldest TREND_WINDOW / PHI reports. A change beyond ± PSI²
   * signals improvement or decline; otherwise the repo is stable.
   *
   * @param {object[]} reports — Array of report objects, newest first.
   * @returns {{ trend: string, delta: number, recentAvg: number, olderAvg: number }}
   */
  detectTrends(reports) {
    if (!reports || reports.length < 2) {
      return { trend: TREND.UNKNOWN, delta: 0, recentAvg: 0, olderAvg: 0 };
    }

    // Compute a simple health proxy for each report (passRate)
    const healthSeries = reports.map(r => {
      const total = r.totalTests || r.total || 0;
      const passed = r.passed || r.passCount || 0;
      return total > 0 ? passed / total : 0;
    });

    // Split into recent half and older half (golden-ratio split)
    const splitIndex = Math.max(1, Math.round(healthSeries.length * PSI));
    const recentSlice = healthSeries.slice(0, splitIndex);
    const olderSlice = healthSeries.slice(splitIndex);

    if (!olderSlice.length) {
      return { trend: TREND.UNKNOWN, delta: 0, recentAvg: phiWeightedMean(recentSlice), olderAvg: 0 };
    }

    const recentAvg = phiWeightedMean(recentSlice);
    const olderAvg = phiWeightedMean(olderSlice);
    const delta = recentAvg - olderAvg;

    let trend;
    if (delta > PSI2 * 0.1) {
      trend = TREND.IMPROVING;
    } else if (delta < -(PSI2 * 0.1)) {
      trend = TREND.DECLINING;
    } else {
      trend = TREND.STABLE;
    }

    return { trend, delta, recentAvg, olderAvg };
  }

  // ─── DASHBOARD ─────────────────────────────────────────────────────────────

  /**
   * Generate full dashboard-ready JSON summary.
   *
   * @returns {object} Dashboard payload with ecosystem health, per-repo details,
   *   trend data, tier distribution, and metadata.
   */
  generateDashboard() {
    const reportsMap = this.collectReports();

    // Per-repo health + trends
    const repoHealths = new Map();
    const repoDetails = {};

    for (const [repoName, reports] of reportsMap) {
      const health = this.computeRepoHealth(reports);
      const trend = this.detectTrends(reports);

      repoHealths.set(repoName, health);
      repoDetails[repoName] = {
        health: {
          score: health.score,
          tier: health.tier,
        },
        trend: {
          direction: trend.trend,
          delta: trend.delta,
          recentAvg: trend.recentAvg,
          olderAvg: trend.olderAvg,
        },
        metrics: health.metrics,
      };
    }

    // Ecosystem aggregate
    const ecosystem = this.computeEcosystemHealth(repoHealths);

    // Build sorted leaderboard (highest score first)
    const leaderboard = Object.entries(repoDetails)
      .map(([name, detail]) => ({ name, score: detail.health.score, tier: detail.health.tier }))
      .sort((a, b) => b.score - a.score);

    // Identify repos that need attention (Degraded or Critical)
    const needsAttention = leaderboard.filter(
      r => r.tier === HEALTH_TIERS.DEGRADED.label || r.tier === HEALTH_TIERS.CRITICAL.label
    );

    const dashboard = {
      _meta: {
        generator: 'Heady™ Ecosystem Health Aggregator',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        phi: PHI,
        reposDir: this.reposDir,
      },
      ecosystem: {
        score: ecosystem.score,
        tier: ecosystem.tier,
        repoCount: ecosystem.repoCount,
        distribution: ecosystem.distribution,
      },
      repos: repoDetails,
      leaderboard,
      needsAttention,
      constants: {
        PHI,
        PSI,
        PSI2,
        tiers: {
          OPTIMAL: HEALTH_TIERS.OPTIMAL.min,
          HEALTHY: HEALTH_TIERS.HEALTHY.min,
          DEGRADED: HEALTH_TIERS.DEGRADED.min,
          CRITICAL: HEALTH_TIERS.CRITICAL.min,
        },
      },
    };

    this._cache = dashboard;
    return dashboard;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  EcosystemHealth,
  PHI,
  PSI,
  PSI2,
  HEALTH_TIERS,
  TREND,
  TREND_WINDOW,
  FIB,
  classifyTier,
  phiWeightedMean,
};

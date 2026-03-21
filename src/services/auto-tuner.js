/*
 * © 2026 Heady™Systems Inc.
 * PROPRIETARY AND CONFIDENTIAL.
 *
 * auto-tuner.js — Periodic analysis of concurrency, batch sizes, cost to self-optimize
 * Liquid microservice: < 150 lines, single responsibility, EventEmitter-based
 *
 * Planned concept from configs/concepts-index.yaml:
 *   id: auto-tuning-loop
 *   priority: medium
 *   description: Periodic analysis of concurrency, batch sizes, cost to self-optimize
 */

const { EventEmitter } = require("events");

const PHI = 1.6180339887498948482;
const PSI = 0.6180339887498948482;
const PHI_5_MS = Math.round(Math.pow(PHI, 5) * 1000);  // 11090ms — analysis interval
const FIB_8 = 21;  // observation window size

class AutoTuner extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.observations = [];
        this.maxObservations = opts.maxObservations || FIB_8;
        this.currentConfig = {
            concurrency: opts.concurrency || 5,
            batchSize: opts.batchSize || 8,
            costMultiplier: opts.costMultiplier || 1.0,
        };
        this.suggestions = [];
        this._timer = null;
    }

    /**
     * Record an observation from a pipeline run or task execution.
     */
    observe(metrics = {}) {
        this.observations.push({
            ...metrics,
            ts: Date.now(),
        });
        if (this.observations.length > this.maxObservations) {
            this.observations.shift();
        }
    }

    /**
     * Analyze observations and suggest tuning adjustments.
     * Returns suggestions without applying them (safe by default).
     */
    analyze() {
        if (this.observations.length < 3) {
            return { suggestions: [], reason: "insufficient_observations" };
        }

        const suggestions = [];

        // Analyze throughput vs concurrency
        const avgDuration = this.observations.reduce((s, o) => s + (o.durationMs || 0), 0) / this.observations.length;
        const errorRate = this.observations.filter(o => o.failed).length / this.observations.length;

        // If error rate > ψ² (0.382), reduce concurrency
        if (errorRate > PSI * PSI) {
            const newConcurrency = Math.max(2, Math.floor(this.currentConfig.concurrency * PSI));
            suggestions.push({
                parameter: "concurrency",
                current: this.currentConfig.concurrency,
                suggested: newConcurrency,
                reason: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds ψ² threshold`,
                confidence: 1 - errorRate,
            });
        }

        // If avg duration > φ⁴×1000 (6854ms) and error rate < ψ, increase batch size
        if (avgDuration > Math.pow(PHI, 4) * 1000 && errorRate < PSI) {
            const newBatch = Math.min(21, Math.ceil(this.currentConfig.batchSize * PHI));
            suggestions.push({
                parameter: "batchSize",
                current: this.currentConfig.batchSize,
                suggested: newBatch,
                reason: `Avg duration ${avgDuration.toFixed(0)}ms exceeds φ⁴ threshold — increase batch`,
                confidence: PSI,
            });
        }

        // If error rate < ψ³ (0.236) and throughput is high, suggest scale-up
        if (errorRate < Math.pow(PSI, 3) && this.observations.length >= this.maxObservations) {
            const newConcurrency = Math.min(21, Math.ceil(this.currentConfig.concurrency * PHI));
            if (newConcurrency !== this.currentConfig.concurrency) {
                suggestions.push({
                    parameter: "concurrency",
                    current: this.currentConfig.concurrency,
                    suggested: newConcurrency,
                    reason: "Low error rate — scale up concurrency",
                    confidence: 1 - errorRate,
                });
            }
        }

        this.suggestions = suggestions;
        this.emit("tune:analyzed", { suggestions, observationCount: this.observations.length });
        return { suggestions, observationCount: this.observations.length };
    }

    /**
     * Apply a specific suggestion by parameter name.
     */
    apply(parameterName) {
        const suggestion = this.suggestions.find(s => s.parameter === parameterName);
        if (!suggestion) return null;

        const old = this.currentConfig[parameterName];
        this.currentConfig[parameterName] = suggestion.suggested;
        this.emit("tune:applied", { parameter: parameterName, old, new: suggestion.suggested });
        return { parameter: parameterName, old, applied: suggestion.suggested };
    }

    /**
     * Start periodic auto-analysis at φ⁵×1000 interval.
     */
    start() {
        if (this._timer) return;
        this._timer = setInterval(() => this.analyze(), PHI_5_MS);
        this.emit("tune:started", { intervalMs: PHI_5_MS });
    }

    stop() {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        this.emit("tune:stopped");
    }

    status() {
        return {
            config: { ...this.currentConfig },
            observationCount: this.observations.length,
            pendingSuggestions: this.suggestions.length,
            running: !!this._timer,
        };
    }
}

module.exports = AutoTuner;

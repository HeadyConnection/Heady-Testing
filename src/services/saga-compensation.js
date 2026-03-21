/*
 * © 2026 Heady™Systems Inc.
 * PROPRIETARY AND CONFIDENTIAL.
 *
 * saga-compensation.js — Multi-step workflow undo/correct on partial failure
 * Liquid microservice: < 120 lines, single responsibility, EventEmitter-based
 *
 * Planned concept from configs/concepts-index.yaml:
 *   id: saga-compensation
 *   priority: high
 *   description: Multi-step workflow undo/correct on partial failure
 */

const { EventEmitter } = require("events");

const PHI = 1.6180339887498948482;
const FIB_5 = 5;   // max compensation retries
const FIB_7 = 13;  // max saga history

class SagaCompensation extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.sagas = new Map();          // sagaId → { steps[], status }
        this.history = [];               // last F(7)=13 completed sagas
        this.maxHistory = opts.maxHistory || FIB_7;
        this.maxRetries = opts.maxRetries || FIB_5;
    }

    /**
     * Register a saga with ordered compensation steps.
     * Each step: { name, execute: async fn, compensate: async fn }
     */
    register(sagaId, steps = []) {
        this.sagas.set(sagaId, {
            id: sagaId,
            steps,
            completedSteps: [],
            status: "registered",
            createdAt: new Date().toISOString(),
        });
        this.emit("saga:registered", { sagaId, stepCount: steps.length });
        return sagaId;
    }

    /**
     * Execute a saga's steps in order. On failure, compensate completed steps in reverse.
     */
    async execute(sagaId, context = {}) {
        const saga = this.sagas.get(sagaId);
        if (!saga) throw new Error(`Saga ${sagaId} not found`);

        saga.status = "executing";
        saga.completedSteps = [];
        this.emit("saga:started", { sagaId });

        for (let i = 0; i < saga.steps.length; i++) {
            const step = saga.steps[i];
            try {
                const result = await step.execute(context);
                saga.completedSteps.push({ name: step.name, result, index: i });
                this.emit("saga:step-completed", { sagaId, step: step.name, index: i });
            } catch (err) {
                saga.status = "compensating";
                this.emit("saga:step-failed", { sagaId, step: step.name, error: err.message });
                await this._compensate(saga, context);
                return { sagaId, status: "compensated", failedAt: step.name, error: err.message };
            }
        }

        saga.status = "completed";
        this._addToHistory(saga);
        this.emit("saga:completed", { sagaId });
        return { sagaId, status: "completed", stepsCompleted: saga.completedSteps.length };
    }

    /**
     * Compensate completed steps in reverse order (undo pattern).
     */
    async _compensate(saga, context) {
        const reversed = [...saga.completedSteps].reverse();
        for (const completed of reversed) {
            const step = saga.steps[completed.index];
            if (!step.compensate) continue;

            for (let attempt = 0; attempt < this.maxRetries; attempt++) {
                try {
                    await step.compensate(context, completed.result);
                    this.emit("saga:compensated-step", { sagaId: saga.id, step: step.name });
                    break;
                } catch (err) {
                    const backoffMs = Math.round(1000 * Math.pow(PHI, attempt));
                    this.emit("saga:compensate-retry", { sagaId: saga.id, step: step.name, attempt, backoffMs });
                    await new Promise(r => setTimeout(r, backoffMs));
                }
            }
        }
        saga.status = "compensated";
        this._addToHistory(saga);
        this.emit("saga:compensated", { sagaId: saga.id });
    }

    _addToHistory(saga) {
        this.history.push({ id: saga.id, status: saga.status, ts: new Date().toISOString() });
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    status() {
        return {
            activeSagas: this.sagas.size,
            historySize: this.history.length,
            recentHistory: this.history.slice(-5),
        };
    }
}

module.exports = SagaCompensation;

/*
 * © 2026 Heady™Systems Inc.
 * PROPRIETARY AND CONFIDENTIAL.
 *
 * event-store.js — Immutable event log for replay and audit
 * Liquid microservice: < 130 lines, single responsibility, EventEmitter-based
 *
 * Planned concept from configs/concepts-index.yaml:
 *   id: event-sourcing
 *   priority: medium
 *   description: Store all state changes as immutable events for replay and audit
 */

const { EventEmitter } = require("events");
const crypto = require("crypto");

const FIB_15 = 610;  // max events in memory
const FIB_8 = 21;    // snapshot interval

class EventStore extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.events = [];
        this.snapshots = [];
        this.maxEvents = opts.maxEvents || FIB_15;
        this.snapshotInterval = opts.snapshotInterval || FIB_8;
        this.sequence = 0;
    }

    /**
     * Append an immutable event to the store.
     * Events are timestamped, sequenced, and hashed for integrity.
     */
    append(type, payload = {}, source = "unknown") {
        const event = {
            sequence: ++this.sequence,
            type,
            payload,
            source,
            ts: new Date().toISOString(),
            hash: this._hash(type, payload, this.sequence),
            prevHash: this.events.length > 0 ? this.events[this.events.length - 1].hash : null,
        };

        this.events.push(event);

        // Trim to max capacity
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Auto-snapshot at Fibonacci intervals
        if (this.sequence % this.snapshotInterval === 0) {
            this._createSnapshot();
        }

        this.emit("event:stored", { sequence: event.sequence, type });
        return event;
    }

    /**
     * Replay events of a specific type, optionally since a given sequence.
     */
    replay(type = null, sinceSequence = 0) {
        const filtered = this.events.filter(e =>
            e.sequence > sinceSequence && (type === null || e.type === type)
        );
        this.emit("event:replayed", { type, count: filtered.length, sinceSequence });
        return filtered;
    }

    /**
     * Get events by source (e.g., "pipeline", "auto-success", "saga").
     */
    bySource(source) {
        return this.events.filter(e => e.source === source);
    }

    /**
     * Create a snapshot of current state for faster replay.
     */
    _createSnapshot() {
        const snapshot = {
            sequence: this.sequence,
            eventCount: this.events.length,
            ts: new Date().toISOString(),
            firstSequence: this.events[0]?.sequence || 0,
            lastHash: this.events[this.events.length - 1]?.hash || null,
        };
        this.snapshots.push(snapshot);
        if (this.snapshots.length > 13) this.snapshots.shift(); // F(7) = 13 max snapshots
        this.emit("event:snapshot", snapshot);
    }

    /**
     * Verify chain integrity — each event's prevHash matches previous event's hash.
     */
    verifyIntegrity() {
        for (let i = 1; i < this.events.length; i++) {
            if (this.events[i].prevHash !== this.events[i - 1].hash) {
                return { valid: false, brokenAt: this.events[i].sequence };
            }
        }
        return { valid: true, eventCount: this.events.length };
    }

    _hash(type, payload, seq) {
        return crypto.createHash("sha256")
            .update(`${seq}:${type}:${JSON.stringify(payload)}`)
            .digest("hex")
            .substring(0, 16);
    }

    status() {
        return {
            totalEvents: this.events.length,
            sequence: this.sequence,
            snapshotCount: this.snapshots.length,
            maxCapacity: this.maxEvents,
        };
    }
}

module.exports = EventStore;

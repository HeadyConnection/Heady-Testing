'use strict';

/**
 * Contract Validator — Service Boundary Contract Testing
 *
 * Validates data contracts between service producers and consumers.
 * Uses semantic resonance scoring (cosine similarity proxy) to measure
 * how closely actual payloads match expected schemas.
 *
 * Supports auto-resolution: when a contract violation is detected,
 * suggests schema mutations that would make the payload valid.
 *
 * Part of the Heady Zero-Intervention Autonomous Testing Infrastructure.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHI-DERIVED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PSI = 0.618033988749895;
const CSL_DRIFT_THRESHOLD = 0.05;

// ═══════════════════════════════════════════════════════════════════════════════
// VIOLATION SEVERITY
// ═══════════════════════════════════════════════════════════════════════════════

const SEVERITY = Object.freeze({
  CRITICAL: 'critical',   // Missing required field, wrong type on key field
  WARNING: 'warning',     // Extra field, minor type mismatch
  INFO: 'info',           // Schema drift within tolerance
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

class ContractValidator {
  constructor() {
    /** @type {Map<string, { producer: string, consumer: string, schema: object }>} */
    this.contracts = new Map();

    /** @type {Array<object>} */
    this.violations = [];

    /** @type {Map<string, { validations: number, violations: number }>} */
    this.stats = new Map();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACT REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a contract between a producer and consumer service.
   * @param {string} producer - Producing service name
   * @param {string} consumer - Consuming service name
   * @param {object} schema   - Expected schema definition
   * @param {object} schema.required - Required fields { fieldName: 'type' }
   * @param {object} [schema.optional] - Optional fields { fieldName: 'type' }
   * @param {object} [schema.constraints] - Additional constraints
   * @returns {string} Contract key
   */
  registerContract(producer, consumer, schema) {
    const key = `${producer}→${consumer}`;
    this.contracts.set(key, { producer, consumer, schema });
    this.stats.set(key, { validations: 0, violations: 0 });
    return key;
  }

  /**
   * Check if a contract exists.
   * @param {string} producer
   * @param {string} consumer
   * @returns {boolean}
   */
  hasContract(producer, consumer) {
    return this.contracts.has(`${producer}→${consumer}`);
  }

  /**
   * Get a registered contract.
   * @param {string} producer
   * @param {string} consumer
   * @returns {object|null}
   */
  getContract(producer, consumer) {
    return this.contracts.get(`${producer}→${consumer}`) || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate a payload against a registered contract.
   * @param {string} producer
   * @param {string} consumer
   * @param {object} payload
   * @returns {{ valid: boolean, violations: Array<object>, resonance: number }}
   */
  validate(producer, consumer, payload) {
    const key = `${producer}→${consumer}`;
    const contract = this.contracts.get(key);

    if (!contract) {
      return {
        valid: false,
        violations: [{
          field: '_contract',
          message: `No contract registered for ${key}`,
          severity: SEVERITY.CRITICAL,
        }],
        resonance: 0,
      };
    }

    const stats = this.stats.get(key);
    stats.validations++;

    const violations = [];
    const schema = contract.schema;

    // Validate required fields
    if (schema.required) {
      for (const [field, expectedType] of Object.entries(schema.required)) {
        if (!(field in payload)) {
          violations.push({
            field,
            message: `Missing required field: ${field}`,
            severity: SEVERITY.CRITICAL,
            expected: expectedType,
            actual: 'undefined',
          });
        } else if (!this._typeMatches(payload[field], expectedType)) {
          violations.push({
            field,
            message: `Type mismatch on ${field}: expected ${expectedType}, got ${typeof payload[field]}`,
            severity: SEVERITY.CRITICAL,
            expected: expectedType,
            actual: typeof payload[field],
          });
        }
      }
    }

    // Validate optional field types (if present)
    if (schema.optional) {
      for (const [field, expectedType] of Object.entries(schema.optional)) {
        if (field in payload && payload[field] !== null && payload[field] !== undefined) {
          if (!this._typeMatches(payload[field], expectedType)) {
            violations.push({
              field,
              message: `Type mismatch on optional ${field}: expected ${expectedType}, got ${typeof payload[field]}`,
              severity: SEVERITY.WARNING,
              expected: expectedType,
              actual: typeof payload[field],
            });
          }
        }
      }
    }

    // Check for unknown extra fields
    const knownFields = new Set([
      ...Object.keys(schema.required || {}),
      ...Object.keys(schema.optional || {}),
    ]);
    for (const field of Object.keys(payload)) {
      if (!knownFields.has(field)) {
        violations.push({
          field,
          message: `Unknown field: ${field} (not in contract)`,
          severity: SEVERITY.INFO,
          expected: 'not_present',
          actual: typeof payload[field],
        });
      }
    }

    // Apply constraints
    if (schema.constraints) {
      for (const constraint of schema.constraints) {
        const result = this._checkConstraint(constraint, payload);
        if (!result.valid) {
          violations.push({
            field: constraint.field || '_constraint',
            message: result.message,
            severity: constraint.severity || SEVERITY.WARNING,
            expected: constraint.expected,
            actual: result.actual,
          });
        }
      }
    }

    // Record violations
    if (violations.length > 0) {
      stats.violations++;
      this.violations.push({
        key,
        timestamp: Date.now(),
        violations,
        payload: this._sanitizePayload(payload),
      });
    }

    // Calculate semantic resonance score
    const resonance = this.getSemanticResonance(schema, payload);

    return {
      valid: violations.filter(v => v.severity === SEVERITY.CRITICAL).length === 0,
      violations,
      resonance,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-RESOLVE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Suggest schema mutations that would resolve a violation.
   * @param {object} violation
   * @returns {{ suggestion: string, mutation: object, confidence: number }}
   */
  autoResolve(violation) {
    if (!violation || !violation.field) {
      return { suggestion: 'none', mutation: null, confidence: 0 };
    }

    // Missing field -> add with default
    if (violation.message && violation.message.includes('Missing required field')) {
      return {
        suggestion: `Add field '${violation.field}' with type '${violation.expected}'`,
        mutation: {
          type: 'add_field',
          field: violation.field,
          defaultValue: this._defaultForType(violation.expected),
        },
        confidence: 0.9,
      };
    }

    // Type mismatch -> coerce
    if (violation.message && violation.message.includes('Type mismatch')) {
      return {
        suggestion: `Coerce '${violation.field}' from ${violation.actual} to ${violation.expected}`,
        mutation: {
          type: 'coerce_type',
          field: violation.field,
          from: violation.actual,
          to: violation.expected,
        },
        confidence: 0.7 * PSI, // Lower confidence for coercion
      };
    }

    // Unknown field -> add to optional schema
    if (violation.message && violation.message.includes('Unknown field')) {
      return {
        suggestion: `Add '${violation.field}' as optional field to contract`,
        mutation: {
          type: 'extend_schema',
          field: violation.field,
          fieldType: violation.actual,
        },
        confidence: 0.8,
      };
    }

    return {
      suggestion: 'Manual review required',
      mutation: null,
      confidence: 0.1,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEMANTIC RESONANCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Compute semantic resonance between expected schema and actual payload.
   * This is a cosine-similarity proxy: measures structural alignment.
   *
   * Score: 0.0 = completely mismatched, 1.0 = perfect match
   *
   * @param {object} schema  - Expected schema { required: {}, optional: {} }
   * @param {object} payload - Actual payload
   * @returns {number} Resonance score (0–1)
   */
  getSemanticResonance(schema, payload) {
    const expectedFields = new Set([
      ...Object.keys(schema.required || {}),
      ...Object.keys(schema.optional || {}),
    ]);
    const actualFields = new Set(Object.keys(payload || {}));

    if (expectedFields.size === 0 && actualFields.size === 0) return 1.0;
    if (expectedFields.size === 0 || actualFields.size === 0) return 0.0;

    // Intersection (dot product proxy)
    let intersection = 0;
    for (const field of expectedFields) {
      if (actualFields.has(field)) intersection++;
    }

    // Cosine similarity = dot / (|A| * |B|)
    const magnitudeA = Math.sqrt(expectedFields.size);
    const magnitudeB = Math.sqrt(actualFields.size);
    const cosine = intersection / (magnitudeA * magnitudeB);

    // Type-match bonus: boost score for correct types
    let typeBonus = 0;
    let typeChecks = 0;
    for (const [field, expectedType] of Object.entries(schema.required || {})) {
      if (field in payload) {
        typeChecks++;
        if (this._typeMatches(payload[field], expectedType)) {
          typeBonus++;
        }
      }
    }
    const typeScore = typeChecks > 0 ? typeBonus / typeChecks : 1.0;

    // Weighted: structural similarity (phi-weighted) + type correctness (psi-weighted)
    return Math.min(1.0, cosine * PHI * 0.5 + typeScore * PSI * 0.5);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS & REPORTING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get validation statistics for all contracts.
   * @returns {object}
   */
  getStats() {
    const result = {};
    for (const [key, stats] of this.stats) {
      result[key] = {
        ...stats,
        violationRate: stats.validations > 0
          ? stats.violations / stats.validations
          : 0,
      };
    }
    return result;
  }

  /**
   * Get all recorded violations.
   * @returns {Array<object>}
   */
  getViolations() {
    return [...this.violations];
  }

  /**
   * Clear violation history.
   */
  clearViolations() {
    this.violations = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a value matches the expected type.
   * @private
   */
  _typeMatches(value, expectedType) {
    if (value === null || value === undefined) return false;

    switch (expectedType) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number' && !isNaN(value);
      case 'boolean': return typeof value === 'boolean';
      case 'object': return typeof value === 'object' && !Array.isArray(value);
      case 'array': return Array.isArray(value);
      case 'function': return typeof value === 'function';
      default: return typeof value === expectedType;
    }
  }

  /**
   * Check a constraint against a payload.
   * @private
   */
  _checkConstraint(constraint, payload) {
    const { field, type, expected } = constraint;
    const value = payload[field];

    switch (type) {
      case 'min':
        return {
          valid: typeof value === 'number' && value >= expected,
          actual: value,
          message: `${field} must be >= ${expected}, got ${value}`,
        };
      case 'max':
        return {
          valid: typeof value === 'number' && value <= expected,
          actual: value,
          message: `${field} must be <= ${expected}, got ${value}`,
        };
      case 'pattern':
        return {
          valid: typeof value === 'string' && new RegExp(expected).test(value),
          actual: value,
          message: `${field} must match pattern ${expected}`,
        };
      case 'enum':
        return {
          valid: Array.isArray(expected) && expected.includes(value),
          actual: value,
          message: `${field} must be one of [${expected}], got ${value}`,
        };
      default:
        return { valid: true, actual: value, message: '' };
    }
  }

  /**
   * Get a default value for a type.
   * @private
   */
  _defaultForType(type) {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'object': return {};
      case 'array': return [];
      default: return null;
    }
  }

  /**
   * Sanitize a payload for storage (truncate large values).
   * @private
   */
  _sanitizePayload(payload) {
    const sanitized = {};
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = value.slice(0, 200) + '...[truncated]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  ContractValidator,
  SEVERITY,
  PHI,
  PSI,
  CSL_DRIFT_THRESHOLD,
};

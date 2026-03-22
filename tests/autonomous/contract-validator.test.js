import { describe, test, expect, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Contract Validator Tests — Service Boundary Contract Validation
// ═══════════════════════════════════════════════════════════════════════════════

const {
  ContractValidator,
  SEVERITY,
  PHI,
  PSI,
} = require('../../src/testing/contract-validator.js');

describe('ContractValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new ContractValidator();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════════════════════════

  test('initializes with empty contracts and violations', () => {
    expect(validator.contracts).toBeInstanceOf(Map);
    expect(validator.contracts.size).toBe(0);
    expect(validator.violations).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Contract Registration
  // ═══════════════════════════════════════════════════════════════════════════

  test('registerContract stores contract and returns key', () => {
    const key = validator.registerContract('api-gateway', 'user-service', {
      required: { userId: 'string', action: 'string' },
    });

    expect(key).toBe('api-gateway→user-service');
    expect(validator.contracts.has(key)).toBe(true);
  });

  test('hasContract returns correct boolean', () => {
    validator.registerContract('A', 'B', { required: {} });
    expect(validator.hasContract('A', 'B')).toBe(true);
    expect(validator.hasContract('B', 'A')).toBe(false);
    expect(validator.hasContract('X', 'Y')).toBe(false);
  });

  test('getContract returns the registered contract', () => {
    const schema = { required: { id: 'number' }, optional: { name: 'string' } };
    validator.registerContract('P', 'C', schema);

    const contract = validator.getContract('P', 'C');
    expect(contract).toBeDefined();
    expect(contract.schema).toEqual(schema);
    expect(contract.producer).toBe('P');
    expect(contract.consumer).toBe('C');
  });

  test('getContract returns null for unregistered contract', () => {
    expect(validator.getContract('X', 'Y')).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Validation — Happy Path
  // ═══════════════════════════════════════════════════════════════════════════

  test('validate returns valid for matching payload', () => {
    validator.registerContract('api', 'db', {
      required: { id: 'number', name: 'string', active: 'boolean' },
    });

    const result = validator.validate('api', 'db', {
      id: 42,
      name: 'test',
      active: true,
    });

    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.resonance).toBeGreaterThan(0);
  });

  test('validate accepts optional fields when present with correct type', () => {
    validator.registerContract('api', 'db', {
      required: { id: 'number' },
      optional: { description: 'string' },
    });

    const result = validator.validate('api', 'db', {
      id: 1,
      description: 'hello',
    });

    expect(result.valid).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Validation — Missing Fields
  // ═══════════════════════════════════════════════════════════════════════════

  test('validate detects missing required fields', () => {
    validator.registerContract('api', 'db', {
      required: { id: 'number', name: 'string' },
    });

    const result = validator.validate('api', 'db', { id: 42 });

    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].field).toBe('name');
    expect(result.violations[0].severity).toBe(SEVERITY.CRITICAL);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Validation — Type Mismatches
  // ═══════════════════════════════════════════════════════════════════════════

  test('validate detects type mismatches on required fields', () => {
    validator.registerContract('api', 'db', {
      required: { id: 'number', name: 'string' },
    });

    const result = validator.validate('api', 'db', { id: 'not-a-number', name: 'valid' });

    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].field).toBe('id');
    expect(result.violations[0].severity).toBe(SEVERITY.CRITICAL);
  });

  test('validate detects type mismatches on optional fields as warnings', () => {
    validator.registerContract('api', 'db', {
      required: { id: 'number' },
      optional: { count: 'number' },
    });

    const result = validator.validate('api', 'db', { id: 1, count: 'not-a-number' });

    expect(result.valid).toBe(true); // Optional type mismatch is WARNING, not CRITICAL
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].severity).toBe(SEVERITY.WARNING);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Validation — Unknown Fields
  // ═══════════════════════════════════════════════════════════════════════════

  test('validate detects unknown extra fields as info', () => {
    validator.registerContract('api', 'db', {
      required: { id: 'number' },
    });

    const result = validator.validate('api', 'db', { id: 1, extra: 'surprise' });

    expect(result.valid).toBe(true); // Info-level, not blocking
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].severity).toBe(SEVERITY.INFO);
    expect(result.violations[0].field).toBe('extra');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Validation — Unregistered Contract
  // ═══════════════════════════════════════════════════════════════════════════

  test('validate returns invalid for unregistered contract', () => {
    const result = validator.validate('unknown', 'service', { data: 'test' });

    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].severity).toBe(SEVERITY.CRITICAL);
    expect(result.resonance).toBe(0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Validation — Array and Object Types
  // ═══════════════════════════════════════════════════════════════════════════

  test('validate handles array type correctly', () => {
    validator.registerContract('api', 'db', {
      required: { items: 'array', meta: 'object' },
    });

    const result = validator.validate('api', 'db', {
      items: [1, 2, 3],
      meta: { key: 'value' },
    });

    expect(result.valid).toBe(true);
  });

  test('validate distinguishes arrays from objects', () => {
    validator.registerContract('api', 'db', {
      required: { data: 'object' },
    });

    const result = validator.validate('api', 'db', { data: [1, 2, 3] });

    expect(result.valid).toBe(false); // Array is not an object in this schema
    expect(result.violations[0].field).toBe('data');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Validation — Constraints
  // ═══════════════════════════════════════════════════════════════════════════

  test('validate checks min constraint', () => {
    validator.registerContract('api', 'db', {
      required: { score: 'number' },
      constraints: [{ field: 'score', type: 'min', expected: 0 }],
    });

    const valid = validator.validate('api', 'db', { score: 50 });
    expect(valid.valid).toBe(true);

    const invalid = validator.validate('api', 'db', { score: -1 });
    expect(invalid.violations.some(v => v.field === 'score')).toBe(true);
  });

  test('validate checks enum constraint', () => {
    validator.registerContract('api', 'db', {
      required: { status: 'string' },
      constraints: [{ field: 'status', type: 'enum', expected: ['active', 'inactive', 'pending'] }],
    });

    const valid = validator.validate('api', 'db', { status: 'active' });
    expect(valid.valid).toBe(true);

    const invalid = validator.validate('api', 'db', { status: 'deleted' });
    expect(invalid.violations.some(v => v.field === 'status')).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Auto-Resolve
  // ═══════════════════════════════════════════════════════════════════════════

  test('autoResolve suggests adding missing field', () => {
    const violation = {
      field: 'name',
      message: 'Missing required field: name',
      severity: SEVERITY.CRITICAL,
      expected: 'string',
    };

    const resolution = validator.autoResolve(violation);
    expect(resolution.suggestion).toContain('Add field');
    expect(resolution.mutation.type).toBe('add_field');
    expect(resolution.mutation.field).toBe('name');
    expect(resolution.mutation.defaultValue).toBe('');
    expect(resolution.confidence).toBe(0.9);
  });

  test('autoResolve suggests type coercion for mismatch', () => {
    const violation = {
      field: 'id',
      message: 'Type mismatch on id: expected number, got string',
      severity: SEVERITY.CRITICAL,
      expected: 'number',
      actual: 'string',
    };

    const resolution = validator.autoResolve(violation);
    expect(resolution.suggestion).toContain('Coerce');
    expect(resolution.mutation.type).toBe('coerce_type');
    expect(resolution.confidence).toBeCloseTo(0.7 * PSI, 5);
  });

  test('autoResolve suggests schema extension for unknown field', () => {
    const violation = {
      field: 'extra',
      message: 'Unknown field: extra (not in contract)',
      severity: SEVERITY.INFO,
      actual: 'string',
    };

    const resolution = validator.autoResolve(violation);
    expect(resolution.mutation.type).toBe('extend_schema');
    expect(resolution.confidence).toBe(0.8);
  });

  test('autoResolve handles null violation', () => {
    const resolution = validator.autoResolve(null);
    expect(resolution.suggestion).toBe('none');
    expect(resolution.confidence).toBe(0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Semantic Resonance
  // ═══════════════════════════════════════════════════════════════════════════

  test('getSemanticResonance returns 1.0 for empty schema and payload', () => {
    const score = validator.getSemanticResonance({ required: {}, optional: {} }, {});
    // Both empty sets -> perfect match
    expect(score).toBe(1.0);
  });

  test('getSemanticResonance returns high score for matching fields', () => {
    const schema = {
      required: { id: 'number', name: 'string' },
    };
    const payload = { id: 42, name: 'test' };

    const score = validator.getSemanticResonance(schema, payload);
    expect(score).toBeGreaterThan(0.7);
  });

  test('getSemanticResonance returns lower score for mismatched fields', () => {
    const schema = {
      required: { id: 'number', name: 'string', email: 'string' },
    };
    const payload = { foo: 'bar', baz: 'qux' };

    const score = validator.getSemanticResonance(schema, payload);
    expect(score).toBeLessThan(0.5);
  });

  test('getSemanticResonance returns 0 for no schema fields', () => {
    const score = validator.getSemanticResonance({}, { data: 'test' });
    expect(score).toBe(0.0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Statistics
  // ═══════════════════════════════════════════════════════════════════════════

  test('getStats tracks validation counts', () => {
    validator.registerContract('A', 'B', { required: { id: 'number' } });

    validator.validate('A', 'B', { id: 1 });
    validator.validate('A', 'B', { id: 'wrong' });
    validator.validate('A', 'B', { id: 2 });

    const stats = validator.getStats();
    expect(stats['A→B'].validations).toBe(3);
    expect(stats['A→B'].violations).toBe(1);
    expect(stats['A→B'].violationRate).toBeCloseTo(1 / 3, 5);
  });

  test('getViolations returns recorded violations', () => {
    validator.registerContract('A', 'B', { required: { id: 'number' } });
    validator.validate('A', 'B', { id: 'wrong' });

    const violations = validator.getViolations();
    expect(violations).toHaveLength(1);
    expect(violations[0].key).toBe('A→B');
  });

  test('clearViolations empties the violations list', () => {
    validator.registerContract('A', 'B', { required: { id: 'number' } });
    validator.validate('A', 'B', { id: 'wrong' });
    expect(validator.getViolations()).toHaveLength(1);

    validator.clearViolations();
    expect(validator.getViolations()).toHaveLength(0);
  });
});

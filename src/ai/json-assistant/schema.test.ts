import { describe, expect, it } from 'vitest';
import {
  createCandidateSchema,
  inferSchema,
  parseJson,
  parseSchema,
  validateJson,
  INPUT_LIMIT,
  SCHEMA_LIMIT
} from './schema';

describe('bounded local structural validation', () => {
  it('infers mixed arrays, checks nested types, missing keys and extra keys', () => {
    const value = parseJson('{"items":[1,"x",null],"paid":true}');
    const schema = parseSchema(JSON.stringify(inferSchema(value)));
    expect(validateJson(value, schema)).toEqual([]);
    expect(
      validateJson({ items: [false], extra: 1 }, schema).join('\n')
    ).toMatch(/missing required property "paid"/);
    expect(
      validateJson({ items: [false], paid: true }, schema).join('\n')
    ).toMatch(/allowed shape/);
    expect(
      validateJson({ items: [], paid: true, extra: 1 }, schema).join('\n')
    ).toMatch(/unexpected property/);
    expect(
      validateJson({ items: [], paid: 'true' }, schema).join('\n')
    ).toMatch(/expected boolean/);
  });
  it('does not treat a single example as business or format validation', () => {
    const schema = inferSchema({ timestamp: '2026-01-01', quantity: 2 });
    expect(
      validateJson({ timestamp: 'not-a-date', quantity: -1 }, schema)
    ).toEqual([]);
    expect(
      validateJson({ timestamp: 'ok', quantity: 1.5 }, schema)
    ).not.toEqual([]);
    expect(validateJson({ anything: true }, parseSchema('{}'))).toEqual([]);
  });
  it.each(['format', 'pattern', 'minimum', '$ref', 'enum', 'allOf'])(
    'rejects unsupported %s constraints',
    (keyword) => {
      expect(() =>
        parseSchema(JSON.stringify({ [keyword]: 'anything' }))
      ).toThrow(/unsupported keyword/);
    }
  );
  it.each([
    '{"type":"unknown"}',
    '{"items":{}}',
    '{"type":"object","required":[1]}',
    '{"anyOf":[]}',
    '{"type":"object","additionalProperties":{}}'
  ])('rejects invalid schema %s', (schema) => {
    expect(() => parseSchema(schema)).toThrow();
  });
  it('limits bytes, depth, number of values, malformed JSON and non-finite numbers', () => {
    expect(() => parseJson('"' + 'a'.repeat(INPUT_LIMIT) + '"')).toThrow(
      /limit/
    );
    expect(() => parseJson('"' + 'é'.repeat(INPUT_LIMIT / 2) + '"')).toThrow(
      /limit/
    );
    expect(() => parseJson('['.repeat(21) + '0' + ']'.repeat(21))).toThrow(
      /complex/
    );
    expect(() => parseJson(JSON.stringify(Array(2000).fill(0)))).toThrow(
      /complex/
    );
    expect(() => parseJson('{')).toThrow(/Invalid JSON/);
    expect(() => parseJson('1e999')).toThrow(/finite/);
  });
  it('accepts the inferred schema of a payload at the supported nesting limit', () => {
    const value = parseJson('{"a":'.repeat(20) + '1' + '}'.repeat(20));
    expect(
      validateJson(value, parseSchema(JSON.stringify(inferSchema(value))))
    ).toEqual([]);
  });
  it('compacts a wide candidate so accepted input can be validated again', () => {
    const input = JSON.stringify(
      Object.fromEntries(
        Array.from({ length: 1600 }, (_, i) => [
          `k${String(i).padStart(4, '0')}`,
          1
        ])
      )
    );
    const value = parseJson(input);
    expect(
      new TextEncoder().encode(JSON.stringify(inferSchema(value), null, 2))
        .length
    ).toBeGreaterThan(SCHEMA_LIMIT);
    const candidate = createCandidateSchema(input);
    expect(new TextEncoder().encode(candidate).length).toBeLessThanOrEqual(
      SCHEMA_LIMIT
    );
    expect(validateJson(value, parseSchema(candidate))).toEqual([]);
    expect(candidate).not.toContain('\n');
  });
  it('keeps small candidates readable and rejects unusable generated candidates', () => {
    expect(createCandidateSchema('{"x":1}')).toContain('\n');
    // Distinct array shapes expand far beyond the schema budget despite valid input.
    const input = JSON.stringify(
      Array.from({ length: 700 }, (_, i) => ({ [String(i)]: 1 }))
    );
    expect(() => parseJson(input)).not.toThrow();
    expect(() => createCandidateSchema(input)).toThrow(
      /inferred schema exceeds/
    );
  });
  it('treats prototype-named keys as data without prototype pollution', () => {
    const value = parseJson('{"__proto__":{"polluted":true},"constructor":1}');
    const schema = parseSchema(JSON.stringify(inferSchema(value)));
    expect(validateJson(value, schema)).toEqual([]);
    expect(validateJson({}, schema)).toHaveLength(2);
    expect(Object.prototype).not.toHaveProperty('polluted');
  });
});

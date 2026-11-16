import { describe, expect, it, vi } from 'vitest';
import { checkJsonInput, checkJsonOutput } from './budget';
import { evaluatePrettify } from '../json-prettify/result';
import { evaluateMinify } from '../json-minify/result';
import { evaluateSort, inspectSortInput } from '../json-sort/result';

const options = { mode: 'key', order: 'asc', key: '' } as const;
describe('JSON resource boundaries', () => {
  it('accepts exact input/depth/token/output boundaries and rejects one over', () => {
    expect(() => checkJsonInput('"' + 'x'.repeat(262142) + '"')).not.toThrow();
    expect(() => checkJsonInput('"' + 'x'.repeat(262143) + '"')).toThrow(
      /too large/
    );
    expect(() =>
      checkJsonInput('['.repeat(64) + '0' + ']'.repeat(64))
    ).not.toThrow();
    expect(() => checkJsonInput('['.repeat(65) + '0' + ']'.repeat(65))).toThrow(
      /64 levels/
    );
    expect(() => checkJsonInput('0\n'.repeat(20000))).not.toThrow();
    expect(() => checkJsonInput('0\n'.repeat(20001))).toThrow(/20,000/);
    expect(checkJsonOutput('x'.repeat(2097152)).length).toBe(2097152);
    expect(() => checkJsonOutput('x'.repeat(2097153))).toThrow(
      /output is too large/
    );
  });
  it('does not count syntax-looking string contents, escaped quotes or Unicode as nesting/values', () => {
    for (const value of [
      '[{,:}]'.repeat(1000),
      '\\"\\\\"[,'.repeat(1000),
      'Việt Nam 😀'.repeat(1000)
    ]) {
      const input = JSON.stringify({ value });
      expect(() => checkJsonInput(input)).not.toThrow();
      expect(evaluateMinify(input)).toMatchObject({
        status: 'valid',
        value: input
      });
    }
  });
  it('refuses all three tools and Sort header parsing before JSON.parse on rejected input', () => {
    const parse = vi.spyOn(JSON, 'parse');
    try {
      for (const source of [
        ' '.repeat(262145),
        '['.repeat(65) + '0' + ']'.repeat(65),
        '0\n'.repeat(20001)
      ]) {
        expect(evaluateSort(source, options).status).toBe('unavailable');
        expect(evaluateMinify(source).status).toBe('unavailable');
        expect(
          evaluatePrettify(source, { indentationType: 'space', spacesCount: 2 })
            .status
        ).toBe('unavailable');
        expect(inspectSortInput(source)).toEqual({ keys: [], format: 'json' });
      }
      expect(parse).not.toHaveBeenCalled();
    } finally {
      parse.mockRestore();
    }
  });
  it('does not publish a large expanded result and can recover without retained output', () => {
    const source = '['.repeat(64) + '0,'.repeat(7999) + '0' + ']'.repeat(64);
    const result = evaluatePrettify(source, {
      indentationType: 'space',
      spacesCount: 10
    });
    expect(result).toMatchObject({ status: 'unavailable', value: '' });
    expect('message' in result && result.message).toMatch(
      /output is too large/
    );
    expect(
      evaluatePrettify('0', { indentationType: 'space', spacesCount: 2 })
    ).toEqual({ status: 'valid', value: '0' });
  });
  it('preserves JSONL format, headers and own keys for accepted Sort input', () => {
    const input = '{"z":1,"__proto__":false}\n{"a":2}';
    expect(inspectSortInput(input)).toEqual({
      keys: ['z', '__proto__', 'a'],
      format: 'jsonl'
    });
    expect(evaluateSort(input, options)).toEqual({
      status: 'valid',
      format: 'jsonl',
      value: '{"__proto__":false,"z":1}\n{"a":2}'
    });
    expect(evaluateSort('', options)).toEqual({
      status: 'empty',
      value: '',
      format: 'json'
    });
    expect(evaluateSort('{private', options)).toEqual({
      status: 'invalid',
      value: '',
      format: 'json',
      message: 'Invalid JSON or JSON Lines input.'
    });
  });
});

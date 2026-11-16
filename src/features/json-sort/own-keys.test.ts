import { describe, expect, it } from 'vitest';
import { sortJson } from '../../pages/tools/json/sort/service';
import type { InitialValuesType } from '../../pages/tools/json/sort/types';

const options: InitialValuesType = { mode: 'key', key: '', order: 'asc' };

describe('JSON Sort own-key preservation', () => {
  it.each(['null', 'false', '0', '"text"', '[1,2]', '{"marker":"own data"}'])(
    'retains a literal __proto__ key with value %s',
    (value) => {
      // An object literal's __proto__ syntax would change the fixture prototype.
      const source = '{"z":0,"__proto__":' + value + ',"a":1}';
      for (const order of ['asc', 'desc'] as const) {
        const output = JSON.parse(
          sortJson(source, { ...options, order }).result
        );
        expect(Object.prototype.hasOwnProperty.call(output, '__proto__')).toBe(
          true
        );
        expect(output).toEqual(JSON.parse(source));
        expect(Object.keys(output)).toHaveLength(3);
      }
    }
  );
  it('preserves prototype-named own keys and nested values in each array row', () => {
    const source =
      '[{"__proto__":{"nested":{"z":0,"a":1}},"constructor":false,"toString":"literal"},{"__proto__":null,"hasOwnProperty":0,"valueOf":["Việt Nam 😀"]}]';
    const output = sortJson(source, options);
    expect(output.format).toBe('json');
    const rows = JSON.parse(output.result) as Record<string, unknown>[];
    expect(rows).toEqual(JSON.parse(source));
    for (const row of rows)
      expect(Object.prototype.hasOwnProperty.call(row, '__proto__')).toBe(true);
    // Key mode sorts only each top-level row, not nested objects.
    expect(
      Object.keys((rows[0].__proto__ as { nested: object }).nested)
    ).toEqual(['z', 'a']);
  });
  it('keeps NDJSON row order, own keys and compact serialization', () => {
    const output = sortJson(
      '\n{"z":1,"__proto__":{"id":1}}\r\n\r\n{"z":2,"__proto__":null}\n',
      options
    );
    expect(output).toEqual({
      format: 'jsonl',
      result: '{"__proto__":{"id":1},"z":1}\n{"__proto__":null,"z":2}'
    });
  });
  it('retains ascending/descending order and the current integer-key serialization rules', () => {
    expect(sortJson('{"z":0,"a":1,"m":2}', options).result).toBe(
      '{\n  "a": 1,\n  "m": 2,\n  "z": 0\n}'
    );
    expect(
      sortJson('{"z":0,"a":1,"m":2}', { ...options, order: 'desc' }).result
    ).toBe('{\n  "z": 0,\n  "m": 2,\n  "a": 1\n}');
    expect(
      Object.keys(
        JSON.parse(
          sortJson('{"10":"ten","2":"two","a":1}', {
            ...options,
            order: 'desc'
          }).result
        )
      )
    ).toEqual(['2', '10', 'a']);
  });
  it('does not change value-mode ordering, missing-key placement or prototype-named row data', () => {
    const source =
      '[{"rank":2,"__proto__":{"marker":2}},{"rank":1,"__proto__":null},{"missing":true}]';
    const result = sortJson(source, {
      mode: 'value',
      key: 'rank',
      order: 'asc'
    });
    expect(JSON.parse(result.result)).toEqual(
      JSON.parse(
        '[{"rank":1,"__proto__":null},{"rank":2,"__proto__":{"marker":2}},{"missing":true}]'
      )
    );
  });
  it('retains existing errors and native JSON numeric/escape semantics', () => {
    expect(() => sortJson('bad', options)).toThrow('Invalid JSON');
    expect(() => sortJson('[]', options)).toThrow('Array is empty');
    expect(() => sortJson('null', options)).toThrow(
      'Input must be a JSON object'
    );
    const output = sortJson(
      '{"n":9007199254740993,"literal":"a\\nb","unicode":"Việt Nam 😀","same":1,"same":2}',
      options
    );
    expect(JSON.parse(output.result)).toEqual({
      n: 9007199254740992,
      literal: 'a\nb',
      unicode: 'Việt Nam 😀',
      same: 2
    });
  });
});

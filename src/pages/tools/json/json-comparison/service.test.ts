import { compareJson } from './service';

describe('compareJson', () => {
  it('does not rewrite commas or brackets inside JSON strings', () => {
    expect(compareJson('{"v":"x,}"}', '{"v":"x}"}', 'text')).toContain(
      'Mismatch'
    );
    const plain = JSON.stringify({
      text: 'comma,} quote" slash\\',
      list: [1, 2]
    });
    const trailing = plain.slice(0, -1) + ',}';
    expect(compareJson(trailing, plain, 'text')).toBe('No differences found');
    expect(compareJson('{"a":[1,2,],}', '{"a":[1,2]}', 'text')).toBe(
      'No differences found'
    );
  });

  it.each([
    ['1', '2'],
    ['null', '{}'],
    ['[]', '{}'],
    ['false', '0'],
    ['{"a":null}', '{"a":{}}']
  ])('compares value and type at every level: %s vs %s', (a, b) => {
    expect(compareJson(a, b, 'text')).toContain('Mismatch');
    expect(compareJson(a, b, 'json')).not.toBe('{}');
  });

  it('uses deep value equality in JSON output mode', () => {
    expect(
      compareJson('{"a":{"b":[1,null]}}', '{"a":{"b":[1,null]}}', 'json')
    ).toBe('{}');
    expect(
      JSON.parse(compareJson('{"a":{"b":1}}', '{"a":{"b":2}}', 'json'))
    ).toEqual({ 'a.b': 'Mismatch: 1 != 2' });
  });

  it('compares own prototype-named keys and keeps them in JSON output', () => {
    const result = JSON.parse(
      compareJson('{"__proto__":1,"toString":2,"constructor":3}', '{}', 'json')
    );
    expect(Object.keys(result)).toEqual([
      '__proto__',
      'toString',
      'constructor'
    ]);
    expect(result.__proto__).toBe('Missing in second JSON');
  });

  it('distinguishes literal dotted keys from nested paths', () => {
    const result = JSON.parse(
      compareJson('{"a.b":1,"a":{"b":1}}', '{"a.b":2,"a":{"b":2}}', 'json')
    );
    expect(Object.keys(result)).toHaveLength(2);
  });

  it.each(['{"a":,}', '[,]', '[1,,]', '{"a":1,,}'])(
    'rejects malformed input %s without repairing missing values',
    (source) => {
      expect(() => compareJson(source, '{}', 'text')).toThrow();
    }
  );

  it('rejects excessive nesting before comparison and recovers', () => {
    expect(() =>
      compareJson('['.repeat(65) + '0' + ']'.repeat(65), '[]', 'text')
    ).toThrow(/nesting/i);
    expect(compareJson('1', '1', 'text')).toBe('No differences found');
  });
  it('should identify missing properties', () => {
    const json1 = '{"name": "John", "age": 30}';
    const json2 = '{"name": "John"}';

    expect(compareJson(json1, json2, 'text')).toContain(
      'age: Missing in second JSON'
    );
  });

  it('should identify value mismatches', () => {
    const json1 = '{"name": "John", "age": 30}';
    const json2 = '{"name": "John", "age": 25}';

    expect(compareJson(json1, json2, 'text')).toContain(
      'age: Mismatch: 30 != 25'
    );
  });

  it('should handle nested objects', () => {
    const json1 = '{"person": {"name": "John", "age": 30}}';
    const json2 = '{"person": {"name": "Jane", "age": 30}}';

    expect(compareJson(json1, json2, 'text')).toContain(
      'person.name: Mismatch: John != Jane'
    );
  });

  it('should return JSON format when specified', () => {
    const json1 = '{"name": "John", "age": 30}';
    const json2 = '{"name": "Jane", "age": 25}';

    const result = compareJson(json1, json2, 'json');
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty('name');
    expect(parsed).toHaveProperty('age');
  });

  it('should handle arrays', () => {
    const json1 = '{"numbers": [1, 2, 3]}';
    const json2 = '{"numbers": [1, 2, 4]}';

    expect(compareJson(json1, json2, 'text')).toContain(
      'numbers.2: Mismatch: 3 != 4'
    );
  });

  it('should return "No differences found" for identical JSONs', () => {
    const json1 = '{"name": "John", "age": 30}';
    const json2 = '{"name": "John", "age": 30}';

    expect(compareJson(json1, json2, 'text')).toBe('No differences found');
  });

  it('should throw error for invalid JSON', () => {
    const json1 = '{"name": "John"';
    const json2 = '{"name": "John"}';

    expect(() => compareJson(json1, json2, 'text')).toThrow();
  });
});

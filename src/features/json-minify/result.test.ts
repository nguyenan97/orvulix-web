import { describe, expect, it } from 'vitest';
import { evaluateMinify } from './result';

describe('current JSON Minify outcome', () => {
  it('separates empty input from invalid whitespace and suppresses parser details', () => {
    expect(evaluateMinify('')).toEqual({
      status: 'empty',
      value: '',
      format: 'json'
    });
    for (const source of [
      ' ',
      '\n\t',
      '{"secret":',
      'undefined',
      '{"a":1}\n{bad}'
    ]) {
      expect(evaluateMinify(source)).toEqual({
        status: 'invalid',
        value: '',
        format: 'json',
        message: 'Invalid JSON or JSON Lines input.'
      });
    }
  });
  it.each([
    ['0', '0'],
    ['false', 'false'],
    ['null', 'null'],
    ['""', '""'],
    ['[]', '[]'],
    [' { "a" : [1, true, null] } ', '{"a":[1,true,null]}'],
    ['{"dup":1,"dup":2}', '{"dup":2}'],
    ['9007199254740993', '9007199254740992'],
    [
      '{"text":"Việt Nam 😀","literal":"a\\nb","html":"<script>"}',
      '{"text":"Việt Nam 😀","literal":"a\\nb","html":"<script>"}'
    ]
  ])('preserves native JSON semantics for %s', (source, value) => {
    expect(evaluateMinify(source)).toEqual({
      status: 'valid',
      value,
      format: 'json'
    });
  });
  it('keeps NDJSON line order, compact values and existing blank-line filtering', () => {
    expect(
      evaluateMinify('\n { "a" : 1 }\r\n\r\n false\nnull\n0\n""\n')
    ).toEqual({
      status: 'valid',
      value: '{"a":1}\nfalse\nnull\n0\n""',
      format: 'jsonl'
    });
  });
  it('keeps a single nonblank line and a multiline JSON array as JSON', () => {
    for (const source of ['\n { "a" : 1 }\n', '[\n1,\n2\n]'])
      expect(evaluateMinify(source).format).toBe('json');
  });
  it('distinguishes excessive nesting from invalid syntax and recovers', () => {
    const source = '['.repeat(20000) + '0' + ']'.repeat(20000);
    expect(() => JSON.parse(source)).not.toThrow();
    expect(evaluateMinify(source)).toEqual({
      status: 'unavailable',
      value: '',
      format: 'json',
      message:
        'JSON nesting exceeds 64 levels. Use a less deeply nested document.'
    });
    expect(evaluateMinify('false')).toEqual({
      status: 'valid',
      value: 'false',
      format: 'json'
    });
  });
});

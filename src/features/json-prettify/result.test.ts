import { describe, expect, it } from 'vitest';
import { evaluatePrettify } from './result';
const options = { indentationType: 'space', spacesCount: 2 } as const;
describe('prettify outcome contract', () => {
  it('separates empty input from invalid whitespace without retaining prior state', () => {
    expect(evaluatePrettify('', options)).toEqual({
      status: 'empty',
      value: ''
    });
    for (const input of [' ', '\n\t', '{"a":', '{"a":1,}', 'undefined']) {
      expect(evaluatePrettify(input, options)).toEqual({
        status: 'invalid',
        value: '',
        message: 'Invalid JSON string'
      });
    }
  });
  it.each([
    ['0', '0'],
    ['false', 'false'],
    ['null', 'null'],
    ['""', '""'],
    ['[]', '[]'],
    ['{"dup":1,"dup":2}', '{\n  "dup": 2\n}'],
    ['9007199254740993', '9007199254740992'],
    [
      '{"markup":"<script>","literal":"a\\nb"}',
      '{\n  "markup": "<script>",\n  "literal": "a\\nb"\n}'
    ]
  ])('preserves formatter semantics for %s', (source, expected) => {
    expect(evaluatePrettify(source, options)).toEqual({
      status: 'valid',
      value: expected
    });
  });
  it('retains compact and tab formatting from the existing service', () => {
    expect(evaluatePrettify('{"a":1}', { ...options, spacesCount: 0 })).toEqual(
      { status: 'valid', value: '{"a":1}' }
    );
    expect(
      evaluatePrettify('{"a":1}', { ...options, indentationType: 'tab' })
    ).toEqual({ status: 'valid', value: '{\n\t"a": 1\n}' });
  });
});

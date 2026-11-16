import { describe, expect, it } from 'vitest';
import { evaluateMinify } from '../json-minify/result';
import { evaluatePrettify } from '../json-prettify/result';

const options = { indentationType: 'space', spacesCount: 2 } as const;
describe('JSON resource admission at existing tool boundaries', () => {
  for (const [name, evaluate] of [
    ['Minify', evaluateMinify],
    ['Prettify', (input: string) => evaluatePrettify(input, options)]
  ] as const) {
    it(`${name} rejects a valid oversized source without publishing output`, () => {
      const source = '"' + 'x'.repeat(256 * 1024) + '"';
      expect(evaluate(source)).toMatchObject({
        status: 'unavailable',
        value: ''
      });
    });
    it(`${name} rejects excessive values and nesting, then recovers`, () => {
      for (const source of [
        '[' + '0,'.repeat(20000) + '0]',
        '['.repeat(65) + '0' + ']'.repeat(65)
      ])
        expect(evaluate(source)).toMatchObject({
          status: 'unavailable',
          value: ''
        });
      expect(evaluate('false')).toMatchObject({
        status: 'valid',
        value: 'false'
      });
    });
  }
});

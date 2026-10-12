import { describe, expect, it, vi } from 'vitest';
import { executeList } from './execute';
import { checkRequest, LIST_LIMITS, type ListRequest } from './model';
const make = (pattern: string, input = 'a,b;c'): ListRequest => ({
  operation: 'reverse',
  input,
  options: {
    splitOperatorType: 'regex',
    splitSeparator: pattern,
    joinSeparator: '|'
  }
});
describe('bounded list service adapter', () => {
  it.each([
    ['[,;]', 'a,b;c', 'c|b|a'],
    ['([,;])', 'a,b;c', 'c|;|b|,|a'],
    ['(?:)', 'ab', 'b|a'],
    ['^|$', 'ab', 'ab'],
    ['x', 'a,,b', 'a,,b'],
    ['[,;]', ',a;;b,', 'b|a']
  ])(
    'retains native split/reverse semantics for %s',
    (pattern, input, expected) => {
      expect(executeList(make(pattern, input))).toBe(expected);
    }
  );
  it('keeps shuffle length handling and item membership', () => {
    const request = make(',', 'a,b,c');
    request.operation = 'shuffle';
    for (const length of ['', 'abc', '99']) {
      request.options.length = length;
      expect(executeList(request).split('|').sort()).toEqual(['a', 'b', 'c']);
    }
    request.options.length = '2';
    const output = executeList(request).split('|');
    expect(output).toHaveLength(2);
    expect(new Set(output).size).toBe(2);
    request.options.length = '0';
    expect(() => executeList(request)).toThrow(/positive/);
  });
  it('reports invalid syntax in the worker service', () => {
    expect(() => executeList(make('['))).toThrow(/regular expression/i);
  });
  it('rejects byte limits and expansion before regex compilation', () => {
    expect(() =>
      checkRequest(make('x', 'é'.repeat(LIST_LIMITS.inputBytes / 2 + 1)))
    ).toThrow(/Input/);
    expect(() =>
      checkRequest(make('x'.repeat(LIST_LIMITS.patternBytes + 1)))
    ).toThrow(/Pattern/);
    const request = make(',');
    request.options.joinSeparator = 'x'.repeat(257);
    expect(() => checkRequest(request)).toThrow(/separator/);
    expect(() => checkRequest(make('(a)', 'a'.repeat(16384)))).not.toThrow();
    request.options.joinSeparator = 'x'.repeat(256);
    request.input = 'a'.repeat(16384);
    expect(() => checkRequest(request)).toThrow(/Potential/);
    const spy = vi.spyOn(globalThis, 'RegExp');
    checkRequest(make('['));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

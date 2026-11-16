import { expect, it } from 'vitest';
import { executeString } from './execute';
import { checkRequest, type SplitOptions } from './model';
import { initialValues } from '../../pages/tools/string/text-replacer/initialValues';
const split: SplitOptions = {
  splitSeparatorType: 'symbol',
  symbolValue: ' ',
  regexValue: '\\s+',
  lengthValue: '2',
  chunksValue: '3',
  outputSeparator: '|',
  charBeforeChunk: '[',
  charAfterChunk: ']'
};

it.each([
  {
    mode: 'text' as const,
    searchValue: 'hi',
    replaceValue: 'x',
    input: 'Hi hi hi',
    expected: 'Hi x x'
  },
  {
    mode: 'regexp' as const,
    searchRegexp: '/hi/gi',
    replaceValue: 'x',
    input: 'Hi hi hi',
    expected: 'x x x'
  },
  {
    mode: 'regexp' as const,
    searchRegexp: '/hi/i',
    replaceValue: 'x',
    input: 'Hi hi hi',
    expected: 'x hi hi'
  },
  {
    mode: 'regexp' as const,
    searchRegexp: '/(a)(b)/g',
    replaceValue: "$2$1|$$|$&|$`|$'",
    input: 'XabY',
    expected: 'Xba|$|ab|X|YY'
  },
  {
    mode: 'regexp' as const,
    searchRegexp: '/(?<first>a)(?<second>b)/g',
    replaceValue: '$<second>$<first>',
    input: 'XabY',
    expected: 'XbaY'
  },
  {
    mode: 'regexp' as const,
    searchRegexp: '(?=a)',
    replaceValue: '-',
    input: 'aa',
    expected: '-a-a'
  }
])(
  'preserves replacement semantics: $expected',
  ({ input, expected, ...options }) => {
    expect(
      executeString({
        tool: 'replace',
        input,
        options: { ...initialValues, ...options }
      })
    ).toBe(expected);
  }
);
it.each([
  { input: 'a b c', options: split, expected: 'a|b|c' },
  {
    input: 'a1b22c',
    options: {
      ...split,
      splitSeparatorType: 'regex' as const,
      regexValue: '\\d+'
    },
    expected: 'a|b|c'
  },
  {
    input: 'a1b',
    options: {
      ...split,
      splitSeparatorType: 'regex' as const,
      regexValue: '(\\d)'
    },
    expected: 'a|1|b'
  },
  {
    input: 'abcdef',
    options: { ...split, splitSeparatorType: 'length' as const },
    expected: 'ab|cd|ef'
  },
  {
    input: 'abcdefg',
    options: { ...split, splitSeparatorType: 'chunks' as const },
    expected: '[abc]|[de]|[fg]'
  }
])('preserves split mode: $expected', ({ input, options, expected }) => {
  expect(executeString({ tool: 'split', input, options })).toBe(expected);
});
it('checks long palindromes without recursive stack growth and preserves join semantics', () => {
  expect(
    executeString({
      tool: 'palindrome',
      input: 'a'.repeat(65536),
      options: {
        splitOperatorType: 'symbol',
        symbolValue: ' ',
        regexValue: '\\s+'
      }
    })
  ).toBe('true');
  expect(
    executeString({
      tool: 'palindrome',
      input: 'radar:hello;anna',
      options: {
        splitOperatorType: 'regex',
        symbolValue: ' ',
        regexValue: '[:;]'
      }
    })
  ).toBe('true[:;]false[:;]true');
});
it('reports invalid regex and rejects expansive substitution/capture/decorations before execution', () => {
  expect(() =>
    executeString({
      tool: 'replace',
      input: 'abc',
      options: { ...initialValues, mode: 'regexp', searchRegexp: '/(/' }
    })
  ).toThrow(/regular expression|unterminated/i);
  expect(() =>
    checkRequest({
      tool: 'replace',
      input: 'a'.repeat(2000),
      options: {
        ...initialValues,
        mode: 'regexp',
        searchRegexp: '.',
        replaceValue: "$`$'"
      }
    })
  ).toThrow(/Potential output/);
  expect(() =>
    checkRequest({
      tool: 'split',
      input: 'a'.repeat(2000),
      options: { ...split, splitSeparatorType: 'regex', regexValue: '(?=(.*))' }
    })
  ).toThrow(/Potential output/);
  expect(() =>
    checkRequest({
      tool: 'split',
      input: 'a'.repeat(10000),
      options: {
        ...split,
        splitSeparatorType: 'chunks',
        chunksValue: '10000',
        charBeforeChunk: '['.repeat(1024)
      }
    })
  ).toThrow(/Potential output/);
});
it('rejects input/pattern/options/item admission failures', () => {
  expect(() =>
    checkRequest({ tool: 'split', input: 'a'.repeat(65537), options: split })
  ).toThrow(/Input/);
  expect(() =>
    checkRequest({
      tool: 'split',
      input: 'abc',
      options: { ...split, regexValue: 'a'.repeat(1025) }
    })
  ).toThrow(/regexValue/);
  expect(() =>
    checkRequest({
      tool: 'split',
      input: 'abc',
      options: { ...split, splitSeparatorType: 'length', lengthValue: 'NaN' }
    })
  ).toThrow(/integer/);
  expect(() =>
    checkRequest({
      tool: 'split',
      input: 'a'.repeat(30000),
      options: { ...split, symbolValue: '' }
    })
  ).toThrow(/20000/);
});

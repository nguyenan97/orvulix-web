import { describe, expect, it } from 'vitest';
import {
  ALL_PAGES,
  parsePageRanges,
  selectedSourcePages,
  type PageSelection
} from './page-ranges';
describe('bounded page range contract', () => {
  it.each([
    ['1', [1]],
    ['1-3', [1, 2, 3]],
    ['1,3,5-7', [1, 3, 5, 6, 7]],
    [' 3 , 1 - 2 , 2-4 , 3 ', [1, 2, 3, 4]],
    ['8,1,8', [1, 8]],
    ['01-02', [1, 2]]
  ] as const)('normalizes %s in document order', (input, expected) =>
    expect(parsePageRanges(input)).toEqual(expected)
  );
  it.each([
    '',
    ' ',
    '0',
    '-1',
    '1.5',
    '1e2',
    'NaN',
    'Infinity',
    '+1',
    '3-1',
    '1-',
    '-2',
    '1--2',
    '1,,2',
    ',1',
    '1,',
    '9',
    '1-9',
    '999999999999999999999999',
    '1;2'
  ])('rejects entire invalid input %s', (input) =>
    expect(() => parsePageRanges(input)).toThrow()
  );
  it('accepts exact limits and rejects bytes/tokens beyond them before expansion', () => {
    expect(parsePageRanges(' '.repeat(127) + '1')).toEqual([1]);
    expect(parsePageRanges(Array(16).fill('1').join(','))).toEqual([1]);
    expect(() => parsePageRanges(' '.repeat(128) + '1')).toThrow(/128/);
    expect(() => parsePageRanges('　'.repeat(43) + '1')).toThrow(/128/);
    expect(() => parsePageRanges(Array(17).fill('1').join(','))).toThrow(
      /16 tokens/
    );
  });
  it('validates source bounds without clamp or fallback', () => {
    expect(selectedSourcePages(ALL_PAGES, 4)).toEqual([1, 2, 3, 4]);
    expect(
      selectedSourcePages({ mode: 'custom', expression: '4,2,2-3' }, 4)
    ).toEqual([2, 3, 4]);
    expect(() =>
      selectedSourcePages({ mode: 'custom', expression: '1,5' }, 4)
    ).toThrow(/outside the 4-page/);
    expect(() =>
      selectedSourcePages({ mode: 'custom', expression: '' }, 4)
    ).toThrow(/Enter/);
    expect(() =>
      selectedSourcePages({ mode: 'bad' } as unknown as PageSelection, 4)
    ).toThrow(/Unsupported/);
    for (const count of [0, -1, 9, 1.2, NaN, Infinity])
      expect(() => selectedSourcePages(ALL_PAGES, count)).toThrow();
  });
});

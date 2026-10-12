import { describe, expect, it } from 'vitest';
import { fixtures } from './fixtures';
import { createRequest } from './request';
import { executeList } from './execute';
import { chunkList } from '../../pages/tools/list/group/service';
import { duplicateList } from '../../pages/tools/list/duplicate/service';
import { isNumber, itemCounter, specialCharMap } from './pure-string';
describe('extended typed list adapters', () => {
  for (const fixture of fixtures) {
    it(`${fixture.operation}: preserves formatting and option mapping`, () => {
      expect(
        executeList(
          createRequest(fixture.operation, fixture.values, fixture.input)
        )
      ).toBe(fixture.expected);
    });
    it(`${fixture.operation}: preserves the service's empty-input result`, () => {
      expect(
        executeList(createRequest(fixture.operation, fixture.values, ''))
      ).toBe(fixture.operation === 'wrap' ? '[]' : '');
    });
    it(`${fixture.operation}: reports invalid syntax in a bounded operation`, () => {
      expect(() =>
        executeList(
          createRequest(
            fixture.operation,
            { ...fixture.values, splitSeparator: '[' },
            fixture.input
          )
        )
      ).toThrow(/Invalid regular expression/);
    });
    it(`${fixture.operation}: retains captures according to filtering options`, () => {
      const capture = createRequest(
        fixture.operation,
        { ...fixture.values, splitSeparator: '([,;])' },
        fixture.input
      );
      if (fixture.operation === 'find-unique')
        expect(executeList(capture)).toBe('c|b');
      // Repeated captured delimiters are not absolutely unique.
      else expect(executeList(capture)).toContain(',');
    });
  }
  it('keeps truncate parseInt and duplicate parseFloat behavior', () => {
    const truncate = fixtures.find((f) => f.operation === 'truncate')!,
      duplicate = fixtures.find((f) => f.operation === 'duplicate')!;
    expect(
      executeList(
        createRequest(
          'truncate',
          { ...truncate.values, length: '2.9items' },
          'a,b,c'
        )
      )
    ).toBe('a|b');
    expect(
      executeList(
        createRequest(
          'duplicate',
          { ...duplicate.values, copy: '1.5copies' },
          'a,b'
        )
      )
    ).toBe('a|b|a');
  });
  it('preserves numeric sort and case-sensitive/length variants', () => {
    const sort = fixtures.find((f) => f.operation === 'sort')!;
    expect(
      executeList(
        createRequest(
          'sort',
          { ...sort.values, sortingMethod: 'numeric' },
          '10,2,x,1'
        )
      )
    ).toBe('1|2|10|x');
    expect(
      executeList(
        createRequest(
          'sort',
          { ...sort.values, sortingMethod: 'length', increasing: false },
          'aa,b,cccc'
        )
      )
    ).toBe('cccc|aa|b');
    expect(
      executeList(
        createRequest('sort', { ...sort.values, caseSensitive: true }, 'b,A,a')
      )
    ).toBe('A|a|b');
  });
  it('handles Group padding, empty separator and bounded decoration', () => {
    const f = fixtures.find((f) => f.operation === 'group')!;
    expect(
      executeList(
        createRequest('group', { ...f.values, padNonFullGroup: true }, 'a,b,c')
      )
    ).toBe('[a;b]|[c;_]');
    expect(
      executeList(
        createRequest('group', { ...f.values, splitSeparator: '' }, 'a,b')
      )
    ).toBe('');
    expect(() =>
      executeList(
        createRequest(
          'group',
          { ...f.values, leftWrap: 'x'.repeat(2048) },
          'a'.repeat(4096)
        )
      )
    ).toThrow(/Potential/);
  });
  it.each([0, -1, 0.5, Infinity, NaN, 4097])(
    'rejects unsafe Group size %s in either mode',
    (size) => {
      for (const mode of ['symbol', 'regex'] as const)
        expect(() =>
          chunkList(mode, ',', 'a,b', size, '', '', '', ',', false, false, '')
        ).toThrow(/Group size/);
    }
  );
  it.each([Infinity, NaN, 1001])(
    'guards duplicate allocation in either mode for %s',
    (copies) => {
      for (const mode of ['symbol', 'regex'] as const)
        expect(() =>
          duplicateList(mode, ',', ',', 'a,b', true, false, copies)
        ).toThrow();
    }
  );
  it('rejects wrong runtime option types and excessive copies before dispatch', () => {
    const f = fixtures.find((f) => f.operation === 'group')!;
    expect(() =>
      createRequest('group', { ...f.values, groupNumber: '2' }, 'a,b')
    ).toThrow(/Invalid groupNumber/);
    const d = fixtures.find((f) => f.operation === 'duplicate')!;
    expect(() =>
      executeList(
        createRequest('duplicate', { ...d.values, copy: '1001' }, 'a,b')
      )
    ).toThrow(/Copies/);
  });
  it('retains native numeric coercion and special-character counting after helper extraction', () => {
    for (const [v, expected] of [
      ['', false],
      ['1e2', true],
      ['1x', false],
      [undefined, false],
      [Infinity, false],
      [0, true]
    ] as const)
      expect(isNumber(v)).toBe(expected);
    expect(itemCounter(['A', 'a', ' ', '\n', ''], true)).toEqual({
      a: 2,
      [specialCharMap[' ']]: 1,
      [specialCharMap['\n']]: 1,
      [specialCharMap['']]: 1
    });
  });
});

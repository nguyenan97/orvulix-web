import { describe, expect, it } from 'vitest';
import { checkRegexInput, executeRegex, REGEX_LIMITS } from './engine';
import { REGEX_SAMPLES, sampleExplanation } from './samples';

describe('local regex engine and authored fixtures', () => {
  it('verifies every authored example and its positive/negative cases', () => {
    for (const sample of REGEX_SAMPLES) {
      expect(executeRegex(sample).matches.length).toBeGreaterThan(0);
      for (const fixture of sample.tests)
        expect(
          executeRegex({ ...sample, text: fixture.text }).matches
        ).toHaveLength(fixture.count);
      expect(sampleExplanation(sample.pattern, sample.flags, sample.text)).toBe(
        sample.explanation
      );
      expect(
        sampleExplanation(sample.pattern, sample.flags, sample.text + 'custom')
      ).toBeUndefined();
    }
  });
  it('captures named/optional groups and exclusive UTF-16 ranges', () => {
    expect(
      executeRegex({ pattern: '(?<first>a)(b)?', flags: 'g', text: 'xa' })
        .matches
    ).toEqual([
      { start: 1, end: 2, captures: ['a', null], groups: [['first', 'a']] }
    ]);
  });
  it('respects non-global and sticky matching', () => {
    expect(
      executeRegex({ pattern: 'a', flags: '', text: 'aa' }).matches
    ).toHaveLength(1);
    expect(
      executeRegex({ pattern: 'a', flags: 'y', text: 'aab' }).matches
    ).toHaveLength(2);
    expect(
      executeRegex({ pattern: 'a', flags: 'y', text: 'ba' }).matches
    ).toHaveLength(0);
  });
  it('terminates empty matches and advances Unicode surrogate pairs correctly', () => {
    expect(
      executeRegex({ pattern: '(?:)', flags: 'g', text: '😀' }).matches.map(
        (m) => m.start
      )
    ).toEqual([0, 1, 2]);
    expect(
      executeRegex({ pattern: '(?:)', flags: 'gu', text: '😀' }).matches.map(
        (m) => m.start
      )
    ).toEqual([0, 2]);
    expect(
      executeRegex({ pattern: '$', flags: 'g', text: '' }).matches
    ).toHaveLength(1);
  });
  it('caps matches, capture count and capture preview size', () => {
    const capped = executeRegex({
      pattern: 'a',
      flags: 'g',
      text: 'a'.repeat(101)
    });
    expect(capped.matches).toHaveLength(100);
    expect(capped.truncated).toBe(true);
    expect(
      executeRegex({ pattern: 'a', flags: 'g', text: 'a'.repeat(100) })
        .truncated
    ).toBe(false);
    expect(
      executeRegex({
        pattern: '(a*)'.repeat(30),
        flags: '',
        text: 'a'.repeat(300)
      }).matches[0].captures
    ).toHaveLength(20);
    expect(
      executeRegex({ pattern: '(a+)', flags: '', text: 'a'.repeat(300) })
        .matches[0].captures[0]
    ).toHaveLength(256);
  });
  it.each(['gg', 'z', 'uv', 'G'])(
    'rejects invalid flags %s without starting evaluation',
    (flags) => {
      expect(() => checkRegexInput({ pattern: 'a', flags, text: 'a' })).toThrow(
        /flags/
      );
    }
  );
  it('rejects invalid syntax, missing patterns and oversized UTF-8 input', () => {
    expect(() => executeRegex({ pattern: '[', flags: '', text: '' })).toThrow();
    expect(() => checkRegexInput({ pattern: '', flags: '', text: '' })).toThrow(
      /Enter/
    );
    expect(() =>
      checkRegexInput({
        pattern: 'a'.repeat(REGEX_LIMITS.patternBytes + 1),
        flags: '',
        text: ''
      })
    ).toThrow(/2 KiB/);
    expect(() =>
      checkRegexInput({ pattern: '.', flags: 'g', text: 'é'.repeat(8193) })
    ).toThrow(/16 KiB/);
  });
});

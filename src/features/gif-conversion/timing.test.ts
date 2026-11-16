import { expect, it } from 'vitest';
import { switchTiming, timing } from './timing';
import type { InitialValuesType } from '../../pages/tools/video/gif/images-to-gif/types';
it.each([
  ['fps', 10, 'delay', 100],
  ['delay', 200, 'fps', 5],
  ['fps', 60, 'delay', 50],
  ['delay', 10000, 'fps', 1]
] as const)(
  'converts %s %s to %s %s within the target range',
  (mode, value, next, expected) => {
    const result = switchTiming(
      { frameRateMode: mode, frameRateValue: value },
      next
    );
    expect(result.options).toEqual({
      frameRateMode: next,
      frameRateValue: expected
    });
    expect(result.adjusted).toBe(value === 60 || value === 10000);
  }
);
it('preserves fractional requests to six conversion decimals and discloses invalid reset', () => {
  expect(
    switchTiming({ frameRateMode: 'fps', frameRateValue: 3 }, 'delay').options
      .frameRateValue
  ).toBe(333.333333);
  expect(
    switchTiming({ frameRateMode: 'delay', frameRateValue: '' }, 'fps')
  ).toEqual({
    options: { frameRateMode: 'fps', frameRateValue: 10 },
    adjusted: true
  });
  expect(
    timing({ frameRateMode: 'delay', frameRateValue: 50.5 }).fps
  ).toBeCloseTo(19.8019802);
});
it.each(['', 0, -1, NaN, Infinity, -Infinity, 60.001] as const)(
  'rejects invalid FPS %s',
  (value) => {
    expect(() =>
      timing({ frameRateMode: 'fps', frameRateValue: value })
    ).toThrow('1 and 60');
  }
);
it.each([49.999, 10000.001, NaN, ''] as const)(
  'rejects invalid delay %s',
  (value) => {
    expect(() =>
      timing({ frameRateMode: 'delay', frameRateValue: value })
    ).toThrow('50 and 10000');
  }
);
it('rejects an invalid runtime mode', () => {
  expect(() =>
    timing({
      frameRateMode: 'unsafe',
      frameRateValue: 10
    } as unknown as InitialValuesType)
  ).toThrow('Choose');
});

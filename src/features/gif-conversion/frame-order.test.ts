import { expect, it } from 'vitest';
import { moveFrame } from './frame-order';
it('moves a frame earlier without changing its identity or mutating the input', () => {
  const first = { order: 0, preview: 'blob:0' },
    second = { order: 1, preview: 'blob:1' };
  const frames = [first, second];
  const moved = moveFrame(frames, 1, -1);
  expect(moved).toEqual([second, first]);
  expect(moved[0]).toBe(second);
  expect(moved).not.toBe(frames);
  expect(frames).toEqual([first, second]);
});
it('moves later and retains repeated objects as separate positions', () => {
  const repeated = { order: 5 },
    other = { order: 9 };
  const frames = [repeated, other, repeated];
  expect(moveFrame(frames, 0, 1)).toEqual([other, repeated, repeated]);
  expect(moveFrame(frames, 1, 1)).toEqual([repeated, repeated, other]);
  expect(frames).toEqual([repeated, other, repeated]);
});
it.each([-1, 3, 1.5, NaN, Infinity])(
  'keeps the original array for invalid index %s',
  (index) => {
    const frames = [0, 1, 2];
    expect(moveFrame(frames, index, 1)).toBe(frames);
  }
);
it('does not replace the array at either boundary or for an empty/single list', () => {
  const frames = [0, 1, 2],
    empty: number[] = [],
    single = [0];
  expect(moveFrame(frames, 0, -1)).toBe(frames);
  expect(moveFrame(frames, 2, 1)).toBe(frames);
  expect(moveFrame(empty, 0, 1)).toBe(empty);
  expect(moveFrame(single, 0, 1)).toBe(single);
  expect(moveFrame(single, 0, -1)).toBe(single);
});

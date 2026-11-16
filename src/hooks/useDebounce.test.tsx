import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import useDebounce from './useDebounce';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('keeps its identity, invokes only the latest callback and coalesces arguments', () => {
  vi.useFakeTimers();
  const first = vi.fn();
  const latest = vi.fn();
  const { result, rerender } = renderHook(
    ({ callback }) => useDebounce(callback, 1000),
    { initialProps: { callback: first } }
  );
  const identity = result.current;
  act(() => {
    result.current('old');
    result.current('new');
  });
  rerender({ callback: latest });
  expect(result.current).toBe(identity);
  act(() => vi.advanceTimersByTime(999));
  expect(first).not.toHaveBeenCalled();
  expect(latest).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(latest).toHaveBeenCalledExactlyOnceWith('new');
});
it('cancels queued work on delay change and unmount, preserving explicit flush', () => {
  vi.useFakeTimers();
  const callback = vi.fn((value: number) => value * 2);
  const { result, rerender, unmount } = renderHook(
    ({ delay }) => useDebounce(callback, delay),
    { initialProps: { delay: 1000 } }
  );
  act(() => result.current(2));
  rerender({ delay: 2000 });
  act(() => vi.advanceTimersByTime(1000));
  expect(callback).not.toHaveBeenCalled();
  act(() => result.current(3));
  expect(result.current.flush()).toBe(6);
  expect(callback).toHaveBeenCalledExactlyOnceWith(3);
  act(() => result.current(4));
  unmount();
  act(() => vi.advanceTimersByTime(3000));
  expect(callback).toHaveBeenCalledTimes(1);
});

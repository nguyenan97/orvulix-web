import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useGhostscriptJob } from './useGhostscriptJob';
afterEach(cleanup);

it('Clear/options changes and unmount abort work, and only the current job can publish', async () => {
  const jobs: {
    signal: AbortSignal;
    resolve: (file: File) => void;
    reject: (error: Error) => void;
  }[] = [];
  const convert = vi.fn(
    (_file: File, _options: { level: number }, signal: AbortSignal) =>
      new Promise<File>((resolve, reject) =>
        jobs.push({ signal, resolve, reject })
      )
  );
  const { result, unmount } = renderHook(() => useGhostscriptJob(convert));
  const input = new File(['pdf'], 'input.pdf');
  let first!: Promise<void>;
  act(() => {
    first = result.current.compute({ level: 1 }, input);
  });
  act(() => result.current.invalidate());
  expect(jobs[0].signal.aborted).toBe(true);
  await act(async () => {
    jobs[0].resolve(input);
    await first;
  });
  expect(result.current.result).toBeNull();
  let second!: Promise<void>;
  act(() => {
    second = result.current.compute({ level: 1 }, input);
  });
  let third!: Promise<void>;
  act(() => {
    third = result.current.compute({ level: 2 }, input);
  });
  expect(jobs[1].signal.aborted).toBe(true);
  const output = new File(['pdf'], 'latest.pdf');
  await act(async () => {
    jobs[1].reject(new Error('old options'));
    await second;
    jobs[2].resolve(output);
    await third;
  });
  expect(result.current.result).toBe(output);
  expect(result.current.error).toBe('');
  let last!: Promise<void>;
  act(() => {
    last = result.current.compute({ level: 3 }, input);
  });
  unmount();
  expect(jobs[3].signal.aborted).toBe(true);
  jobs[3].reject(new Error('unmounted'));
  await last;
});

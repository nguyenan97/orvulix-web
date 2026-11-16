import { act, cleanup, render, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import ToolMultiFileResult from '../../components/result/ToolMultiFileResult';
import { usePdfConversion } from './usePdfConversion';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('balances preview URLs across rerenders, replacement, Clear and StrictMode unmount', () => {
  let sequence = 0;
  const live = new Set<string>();
  const create = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
    const url = `blob:test-${++sequence}`;
    live.add(url);
    return url;
  });
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
    expect(live.delete(url)).toBe(true);
  });
  const first = new File(['image'], 'a.png', { type: 'image/png' });
  const second = new File(['image'], 'b.png', { type: 'image/png' });
  const view = (files: File[]) => (
    <StrictMode>
      <ToolMultiFileResult value={files} />
    </StrictMode>
  );
  const { rerender, unmount } = render(view([first]));
  expect(live.size).toBe(1);
  const count = create.mock.calls.length;
  rerender(view([first]));
  expect(create).toHaveBeenCalledTimes(count);
  rerender(view([second]));
  expect(live.size).toBe(1);
  rerender(view([]));
  expect(live.size).toBe(0);
  rerender(view([first, second]));
  expect(live.size).toBe(2);
  unmount();
  expect(live.size).toBe(0);
  expect(revoke).toHaveBeenCalledTimes(create.mock.calls.length);
});

it('does not allocate preview URLs for unknown file types', () => {
  const create = vi.spyOn(URL, 'createObjectURL');
  render(
    <ToolMultiFileResult
      value={[new File(['text'], 'a.txt', { type: 'text/plain' })]}
    />
  );
  expect(create).not.toHaveBeenCalled();
});

it('aborts obsolete jobs and suppresses late success/errors after Clear, replacement and unmount', async () => {
  const jobs: {
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    signal: AbortSignal;
  }[] = [];
  const convert = vi.fn(
    (_file: File, signal: AbortSignal) =>
      new Promise<string>((resolve, reject) =>
        jobs.push({ resolve, reject, signal })
      )
  );
  const { result, unmount } = renderHook(() => usePdfConversion(convert));
  const file = new File(['pdf'], 'a.pdf');
  let first!: Promise<void>;
  act(() => {
    first = result.current.compute({}, file);
  });
  expect(result.current.loading).toBe(true);
  act(() => result.current.invalidate());
  expect(jobs[0].signal.aborted).toBe(true);
  await act(async () => {
    jobs[0].resolve('old success');
    await first;
  });
  expect(result.current.result).toBeNull();
  expect(result.current.loading).toBe(false);
  let second!: Promise<void>;
  act(() => {
    second = result.current.compute({}, file);
  });
  let third!: Promise<void>;
  act(() => {
    third = result.current.compute({}, new File(['pdf'], 'b.pdf'));
  });
  expect(jobs[1].signal.aborted).toBe(true);
  await act(async () => {
    jobs[1].reject(new Error('old failure'));
    await second;
    jobs[2].resolve('latest');
    await third;
  });
  expect(result.current.result).toBe('latest');
  expect(result.current.error).toBe('');
  let last!: Promise<void>;
  act(() => {
    last = result.current.compute({}, file);
  });
  unmount();
  expect(jobs[3].signal.aborted).toBe(true);
  jobs[3].reject(new Error('after unmount'));
  await last;
});

it('shows current failure and recovers on the next successful job', async () => {
  const convert = vi
    .fn()
    .mockRejectedValueOnce(new Error('Controlled failure'))
    .mockResolvedValueOnce('valid');
  const { result } = renderHook(() => usePdfConversion<string>(convert));
  await act(async () => {
    await result.current.compute({}, new File(['pdf'], 'a.pdf'));
  });
  expect(result.current.error).toBe('Controlled failure');
  await act(async () => {
    await result.current.compute({}, new File(['pdf'], 'b.pdf'));
  });
  expect(result.current.result).toBe('valid');
  expect(result.current.error).toBe('');
});

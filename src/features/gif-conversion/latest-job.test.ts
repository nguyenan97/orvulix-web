import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { LatestGifJob, GifEncoder, GifState } from './latest-job';
import { GifInputError } from './input-error';
import type { InitialValuesType } from '../../pages/tools/video/gif/images-to-gif/types';
const options: InitialValuesType = { frameRateMode: 'fps', frameRateValue: 10 };
const file = () => new File(['input'], 'source.png', { type: 'image/png' });
const output = () =>
  new File(['encoded'], 'animated.gif', { type: 'image/gif' });
let publish = vi.fn<(state: GifState) => void>();
let encode = vi.fn<GifEncoder>();
let busy = vi.fn<(value: boolean) => void>();
let job: LatestGifJob;
beforeEach(() => {
  vi.useFakeTimers();
  publish = vi.fn();
  encode = vi.fn();
  busy = vi.fn();
  job = new LatestGifJob(publish, encode, busy);
});
afterEach(() => {
  job.dispose();
  vi.useRealTimers();
});
it('does not encode on construction, edits, empty Create or elapsed old debounce', async () => {
  job.invalidate();
  await job.run(options, []);
  await vi.advanceTimersByTimeAsync(2000);
  expect(encode).not.toHaveBeenCalled();
  expect(busy).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  expect(publish).toHaveBeenLastCalledWith({
    result: null,
    error: '',
    loading: false
  });
});
it('starts immediately, snapshots current files/options and owns busy until settlement', async () => {
  let finish!: (file: File) => void;
  encode.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const files = [file()],
    values = { ...options };
  const pending = job.run(values, files);
  files.pop();
  values.frameRateValue = 30;
  expect(encode).toHaveBeenCalledOnce();
  expect(encode.mock.calls[0][0]).toHaveLength(1);
  expect(encode.mock.calls[0][1].frameRateValue).toBe(10);
  expect(publish).toHaveBeenLastCalledWith({
    result: null,
    loading: true,
    error: ''
  });
  expect(busy).toHaveBeenLastCalledWith(true);
  expect(vi.getTimerCount()).toBe(0);
  finish(output());
  await pending;
  expect(publish.mock.calls.at(-1)![0].result?.name).toBe('animated.gif');
  expect(busy.mock.calls.map(([value]) => value)).toEqual([true, false]);
});
it.each(['success', 'error'] as const)(
  'drops cancelled late %s, blocks overlapping Create and permits a fresh run after settlement',
  async (outcome) => {
    let finish!: (file: File) => void, fail!: (error: Error) => void;
    encode.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          finish = resolve;
          fail = reject;
        })
    );
    const pending = job.run(options, [file()]);
    const signal = encode.mock.calls[0][2];
    job.invalidate();
    expect(signal.aborted).toBe(true);
    await job.run({ ...options, frameRateValue: 20 }, [file()]);
    expect(encode).toHaveBeenCalledOnce();
    expect(busy).toHaveBeenLastCalledWith(true);
    const count = publish.mock.calls.length;
    if (outcome === 'success') finish(output());
    else fail(Error('old failure'));
    await pending;
    expect(publish).toHaveBeenCalledTimes(count);
    expect(publish).toHaveBeenLastCalledWith({
      result: null,
      loading: false,
      error: ''
    });
    expect(busy).toHaveBeenLastCalledWith(false);
    encode.mockResolvedValueOnce(output());
    await job.run({ ...options, frameRateValue: 20 }, [file()]);
    expect(encode).toHaveBeenCalledTimes(2);
    expect(encode.mock.calls[1][1].frameRateValue).toBe(20);
    expect(publish.mock.calls.at(-1)![0].result).not.toBeNull();
    expect(busy.mock.calls.map(([value]) => value)).toEqual([
      true,
      false,
      true,
      false
    ]);
  }
);
it.each(['clear', 'dispose'] as const)(
  'discards late output after %s without timers',
  async (action) => {
    let finish!: (file: File) => void;
    encode.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const pending = job.run(options, [file()]);
    if (action === 'clear') job.invalidate();
    else job.dispose();
    const count = publish.mock.calls.length;
    finish(output());
    await pending;
    expect(publish).toHaveBeenCalledTimes(count);
    expect(encode.mock.calls[0][2].aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(busy).toHaveBeenLastCalledWith(false);
  }
);
it('reports current controlled failures and recovers with a fresh explicit Create', async () => {
  encode.mockRejectedValueOnce(
    new GifInputError('Resize images to equal decoded dimensions.')
  );
  await job.run(options, [file()]);
  expect(publish).toHaveBeenLastCalledWith({
    result: null,
    loading: false,
    error: 'Resize images to equal decoded dimensions.'
  });
  expect(busy).toHaveBeenLastCalledWith(false);
  encode.mockResolvedValueOnce(output());
  await job.run(options, [file()]);
  expect(publish.mock.calls.at(-1)![0].error).toBe('');
  expect(publish.mock.calls.at(-1)![0].result).not.toBeNull();
});
it('handles synchronous encoder failure without leaking busy state', async () => {
  encode.mockImplementationOnce(() => {
    throw Error('worker failed');
  });
  await job.run(options, [file()]);
  expect(publish.mock.calls.at(-1)![0].error).toContain('supported images');
  expect(busy).toHaveBeenLastCalledWith(false);
});

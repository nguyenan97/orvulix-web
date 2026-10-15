import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { LatestGifJob, GifEncoder, GifState } from './latest-job';
import type { InitialValuesType } from '../../pages/tools/video/gif/images-to-gif/types';
const options: InitialValuesType = { frameRateMode: 'fps', frameRateValue: 10 };
const file = () => new File(['input'], 'source.png', { type: 'image/png' });
const output = () =>
  new File(['encoded'], 'animated.gif', { type: 'image/gif' });
let publish = vi.fn<(state: GifState) => void>();
let encode = vi.fn<GifEncoder>();
let job: LatestGifJob;
beforeEach(() => {
  vi.useFakeTimers();
  publish = vi.fn();
  encode = vi.fn();
  job = new LatestGifJob(publish, encode);
});
afterEach(() => {
  job.dispose();
  vi.useRealTimers();
});
it('clears before debounce without encoding and preserves the 1000ms boundary', async () => {
  job.schedule(options, [file()]);
  await vi.advanceTimersByTimeAsync(999);
  expect(encode).not.toHaveBeenCalled();
  job.invalidate();
  await vi.advanceTimersByTimeAsync(1);
  expect(encode).not.toHaveBeenCalled();
  expect(publish).toHaveBeenLastCalledWith({
    result: null,
    error: '',
    loading: false
  });
});
it('snapshots files/options and publishes only a completed current run', async () => {
  const files = [file()];
  const values = { ...options };
  encode.mockResolvedValue(output());
  job.schedule(values, files);
  files.pop();
  values.frameRateValue = 30;
  await vi.advanceTimersByTimeAsync(1000);
  expect(encode.mock.calls[0][0]).toHaveLength(1);
  expect(encode.mock.calls[0][1].frameRateValue).toBe(10);
  expect(publish.mock.calls.at(-1)![0].result?.name).toBe('animated.gif');
});
it.each(['success', 'error'] as const)(
  'ignores old %s and loading completion while the new run is active',
  async (outcome) => {
    let finishOld!: (f: File) => void;
    let failOld!: (e: Error) => void;
    let finishNew!: (f: File) => void;
    encode.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          finishOld = resolve;
          failOld = reject;
        })
    );
    encode.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishNew = resolve;
        })
    );
    job.schedule(options, [file()]);
    await vi.advanceTimersByTimeAsync(1000);
    const signal = encode.mock.calls[0][2];
    job.schedule({ ...options, frameRateValue: 20 }, [file()]);
    expect(signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    const count = publish.mock.calls.length;
    if (outcome === 'success') finishOld(output());
    else failOld(Error('old failure'));
    await Promise.resolve();
    expect(publish).toHaveBeenCalledTimes(count);
    expect(publish).toHaveBeenLastCalledWith({
      result: null,
      error: '',
      loading: true
    });
    finishNew(output());
    await Promise.resolve();
    expect(publish.mock.calls.at(-1)![0].result).not.toBeNull();
  }
);
it.each(['clear', 'dispose'] as const)(
  'ignores late active output after %s and clears all timers',
  async (action) => {
    let finish!: (f: File) => void;
    encode.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    job.schedule(options, [file()]);
    await vi.advanceTimersByTimeAsync(1000);
    if (action === 'clear') job.invalidate();
    else job.dispose();
    const count = publish.mock.calls.length;
    finish(output());
    await Promise.resolve();
    expect(publish).toHaveBeenCalledTimes(count);
    expect(encode.mock.calls[0][2].aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  }
);
it('cancels pending debounce on unmount and allows new input to recover from error', async () => {
  job.schedule(options, [file()]);
  job.dispose();
  await vi.advanceTimersByTimeAsync(1000);
  expect(encode).not.toHaveBeenCalled();
  encode.mockRejectedValueOnce(Error('decoder failed'));
  job.schedule(options, [file()]);
  await vi.advanceTimersByTimeAsync(1000);
  expect(publish.mock.calls.at(-1)![0].error).toContain('supported images');
  encode.mockResolvedValueOnce(output());
  job.schedule(options, [file()]);
  expect(publish).toHaveBeenLastCalledWith({
    result: null,
    error: '',
    loading: false
  });
  await vi.advanceTimersByTimeAsync(1000);
  expect(publish.mock.calls.at(-1)![0].error).toBe('');
  expect(publish.mock.calls.at(-1)![0].result).not.toBeNull();
});

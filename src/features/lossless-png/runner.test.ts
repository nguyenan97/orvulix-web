// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { runOptimization, type PngWorker } from './runner';
import { LIMITS } from './png';
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function setup() {
  const worker: PngWorker = {
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn()
  };
  const controller = new AbortController(),
    file = new File([new Uint8Array(100)], 'test.png');
  const run = (timeoutMs?: number) =>
    runOptimization(file, controller.signal, {
      createWorker: () => worker,
      timeoutMs
    });
  return { worker, controller, file, run };
}
it('validates a result and settles exactly once while releasing its worker', async () => {
  const s = setup(),
    result = s.run(),
    message = s.worker.onmessage!,
    bytes = new ArrayBuffer(60);
  message({ data: { bytes } } as MessageEvent);
  message({ data: { bytes: new ArrayBuffer(70) } } as MessageEvent);
  await expect(result).resolves.toBe(bytes);
  expect(s.worker.terminate).toHaveBeenCalledOnce();
  expect(s.worker.onmessage).toBeNull();
});
it.each([
  'abort',
  'timeout',
  'expired-message',
  'malformed',
  'error',
  'messageerror',
  'post'
])('rejects %s, terminates once and allows fresh recovery', async (mode) => {
  vi.useFakeTimers();
  const s = setup();
  const now = vi.spyOn(performance, 'now').mockReturnValue(0);
  if (mode === 'post')
    vi.mocked(s.worker.postMessage).mockImplementation(() => {
      throw Error();
    });
  const result = s.run(10),
    assertion = expect(result).rejects.toThrow();
  const message = s.worker.onmessage;
  if (mode === 'abort') s.controller.abort();
  if (mode === 'timeout') await vi.advanceTimersByTimeAsync(10);
  if (mode === 'expired-message') {
    now.mockReturnValue(11);
    message!({ data: { bytes: new ArrayBuffer(60) } } as MessageEvent);
  }
  if (mode === 'malformed')
    message!({ data: { bytes: new ArrayBuffer(101) } } as MessageEvent);
  if (mode === 'error') s.worker.onerror!({} as ErrorEvent);
  if (mode === 'messageerror') s.worker.onmessageerror!({} as MessageEvent);
  await assertion;
  message?.({ data: { bytes: new ArrayBuffer(60) } } as MessageEvent);
  expect(s.worker.terminate).toHaveBeenCalledOnce();
  now.mockRestore();
  const next = setup(),
    recovery = next.run();
  next.worker.onmessage!({
    data: { bytes: new ArrayBuffer(60) }
  } as MessageEvent);
  await expect(recovery).resolves.toBeInstanceOf(ArrayBuffer);
});
it('rejects admission/aborted runs before worker startup and reports startup failures', async () => {
  const createWorker = vi.fn(() => {
      throw Error();
    }),
    controller = new AbortController();
  await expect(
    runOptimization(
      new File([new Uint8Array(LIMITS.bytes + 1)], 'big'),
      controller.signal,
      { createWorker }
    )
  ).rejects.toThrow(/4 MiB/);
  controller.abort();
  await expect(
    runOptimization(
      new File([new Uint8Array(100)], 'small'),
      controller.signal,
      { createWorker }
    )
  ).rejects.toThrow();
  expect(createWorker).not.toHaveBeenCalled();
  await expect(
    runOptimization(
      new File([new Uint8Array(100)], 'small'),
      new AbortController().signal,
      { createWorker }
    )
  ).rejects.toThrow(/start/);
});

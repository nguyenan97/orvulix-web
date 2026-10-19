// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runChecksum, type HashWorker } from './runner';
import { MAX_FILE_BYTES } from './model';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function setup() {
  const worker: HashWorker = {
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn()
  };
  const createWorker = vi.fn(() => worker);
  const controller = new AbortController();
  const file = new File(['abc'], 'abc.txt');
  const run = (timeoutMs?: number) =>
    runChecksum(file, 'SHA-256', controller.signal, {
      createWorker,
      timeoutMs
    });
  return { worker, createWorker, controller, file, run };
}
describe('bounded worker ownership', () => {
  it('publishes validated output once and releases worker and listeners', async () => {
    const ui = setup(),
      remove = vi.spyOn(ui.controller.signal, 'removeEventListener');
    const result = ui.run();
    expect(ui.worker.postMessage).toHaveBeenCalledWith({
      file: ui.file,
      algorithm: 'SHA-256'
    });
    const message = ui.worker.onmessage!;
    message({ data: { digest: 'a'.repeat(64) } } as MessageEvent);
    message({ data: { digest: 'b'.repeat(64) } } as MessageEvent);
    await expect(result).resolves.toBe('a'.repeat(64));
    expect(ui.worker.terminate).toHaveBeenCalledOnce();
    expect(ui.worker.onmessage).toBeNull();
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  });
  it('cancels and ignores a queued completion', async () => {
    const ui = setup(),
      result = ui.run(),
      message = ui.worker.onmessage!;
    ui.controller.abort();
    message({ data: { digest: 'a'.repeat(64) } } as MessageEvent);
    await expect(result).rejects.toThrow('cancelled');
    expect(ui.worker.terminate).toHaveBeenCalledOnce();
  });
  it('times out and releases a stuck worker', async () => {
    vi.useFakeTimers();
    const ui = setup(),
      result = ui.run(10),
      assertion = expect(result).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    expect(ui.worker.terminate).toHaveBeenCalledOnce();
  });
  it('rejects a completion arriving after the wall-clock deadline', async () => {
    const ui = setup();
    const now = vi.spyOn(performance, 'now').mockReturnValue(0);
    const result = ui.run(10);
    now.mockReturnValue(11);
    ui.worker.onmessage!({ data: { digest: 'a'.repeat(64) } } as MessageEvent);
    await expect(result).rejects.toThrow('timed out');
    now.mockRestore();
  });
  it.each(['malformed', 'error', 'messageerror', 'post'])(
    'settles %s failures and can start a fresh run',
    async (mode) => {
      const ui = setup();
      if (mode === 'post')
        vi.mocked(ui.worker.postMessage).mockImplementation(() => {
          throw Error();
        });
      const result = ui.run();
      if (mode === 'malformed')
        ui.worker.onmessage!({
          data: { digest: 'g'.repeat(64) }
        } as MessageEvent);
      if (mode === 'error') ui.worker.onerror!({} as ErrorEvent);
      if (mode === 'messageerror')
        ui.worker.onmessageerror!({} as MessageEvent);
      await expect(result).rejects.toThrow();
      expect(ui.worker.terminate).toHaveBeenCalledOnce();
      const fresh = setup(),
        recovered = fresh.run();
      fresh.worker.onmessage!({
        data: { digest: 'b'.repeat(64) }
      } as MessageEvent);
      await expect(recovered).resolves.toBe('b'.repeat(64));
    }
  );
  it('does not start workers for rejected sizes, aborted runs or missing crypto', async () => {
    const ui = setup();
    await expect(
      runChecksum(
        { size: MAX_FILE_BYTES + 1 } as File,
        'SHA-256',
        ui.controller.signal,
        { createWorker: ui.createWorker }
      )
    ).rejects.toThrow('64 MiB');
    ui.controller.abort();
    await expect(ui.run()).rejects.toThrow('cancelled');
    expect(ui.createWorker).not.toHaveBeenCalled();
    vi.stubGlobal('crypto', {});
    await expect(setup().run()).rejects.toThrow('Web Crypto');
  });
  it('reports startup failure', async () => {
    const ui = setup();
    await expect(
      runChecksum(ui.file, 'SHA-256', ui.controller.signal, {
        createWorker: () => {
          throw Error();
        }
      })
    ).rejects.toThrow('start');
  });
});

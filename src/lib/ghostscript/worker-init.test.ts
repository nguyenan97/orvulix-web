import { afterEach, expect, it, vi } from 'vitest';
import { compressWithGhostScript } from './worker-init';

const workers: FakeWorker[] = [];
class FakeWorker extends EventTarget {
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    super();
    workers.push(this);
  }
}
afterEach(() => {
  workers.length = 0;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('rejects and terminates after an actual worker error instead of hanging', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('Worker', FakeWorker);
  const request = { bytes: new ArrayBuffer(3) };
  const operation = compressWithGhostScript(request);
  workers[0].dispatchEvent(new Event('error'));
  const settled = Promise.race([
    operation.then(
      () => 'success',
      () => 'rejected'
    ),
    new Promise((resolve) => setTimeout(() => resolve('hung'), 100))
  ]);
  await vi.advanceTimersByTimeAsync(100);
  expect(await settled).toBe('rejected');
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
});

it.each(['messageerror', 'error'])(
  'cleans listeners and deadline on %s',
  async (type) => {
    vi.useFakeTimers();
    vi.stubGlobal('Worker', FakeWorker);
    const operation = compressWithGhostScript({ bytes: new ArrayBuffer(3) });
    const remove = vi.spyOn(workers[0], 'removeEventListener');
    const rejected = expect(operation).rejects.toThrow(/worker/i);
    workers[0].dispatchEvent(new Event(type));
    await rejected;
    expect(remove).toHaveBeenCalledTimes(3);
    expect(workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  }
);

it('times out and terminates a worker that never responds', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('Worker', FakeWorker);
  const operation = compressWithGhostScript({ bytes: new ArrayBuffer(3) });
  const rejected = expect(operation).rejects.toThrow('30 second limit');
  await vi.advanceTimersByTimeAsync(30000);
  await rejected;
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('aborts once and removes the abort listener', async () => {
  vi.stubGlobal('Worker', FakeWorker);
  const controller = new AbortController();
  const remove = vi.spyOn(controller.signal, 'removeEventListener');
  const operation = compressWithGhostScript(
    { bytes: new ArrayBuffer(3) },
    controller.signal
  );
  const rejected = expect(operation).rejects.toThrow('cancelled');
  controller.abort();
  workers[0].dispatchEvent(
    new MessageEvent('message', { data: { ok: false } })
  );
  await rejected;
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
});

it.each([
  { ok: false },
  { ok: true, bytes: 'not bytes' },
  { ok: true, bytes: new Uint8Array([1, 2, 3, 4, 5]).buffer }
])('rejects malformed or failed worker output', async (data) => {
  vi.stubGlobal('Worker', FakeWorker);
  const operation = compressWithGhostScript({ bytes: new ArrayBuffer(3) });
  const rejected = expect(operation).rejects.toThrow(/failed|invalid/i);
  workers[0].dispatchEvent(new MessageEvent('message', { data }));
  await rejected;
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
});

it('transfers input and accepts validated PDF bytes, then ignores duplicate messages', async () => {
  vi.stubGlobal('Worker', FakeWorker);
  const bytes = new ArrayBuffer(3);
  const operation = compressWithGhostScript({ bytes });
  expect(workers[0].postMessage).toHaveBeenCalledWith(
    expect.objectContaining({ target: 'wasm' }),
    [bytes]
  );
  const output = new TextEncoder().encode('%PDF-synthetic').buffer;
  workers[0].dispatchEvent(
    new MessageEvent('message', { data: { ok: true, bytes: output } })
  );
  expect(await operation).toBe(output);
  workers[0].dispatchEvent(new Event('error'));
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
});

it('cleans up when posting fails', async () => {
  vi.stubGlobal(
    'Worker',
    class extends FakeWorker {
      constructor() {
        super();
        this.postMessage.mockImplementation(() => {
          throw new Error('Transfer failed');
        });
      }
    }
  );
  await expect(
    compressWithGhostScript({ bytes: new ArrayBuffer(3) })
  ).rejects.toThrow('Could not send');
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
});

it('rejects startup failure and pre-aborted requests without leaking a worker', async () => {
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw new Error('Worker blocked');
      }
    }
  );
  await expect(
    compressWithGhostScript({ bytes: new ArrayBuffer(3) })
  ).rejects.toThrow('Could not start');
  const controller = new AbortController();
  controller.abort();
  await expect(
    compressWithGhostScript({ bytes: new ArrayBuffer(3) }, controller.signal)
  ).rejects.toThrow('cancelled');
  expect(workers).toHaveLength(0);
});

it('rejects oversize input and output before publication', async () => {
  vi.stubGlobal('Worker', FakeWorker);
  const bytes = new ArrayBuffer(3);
  Object.defineProperty(bytes, 'byteLength', { value: 32 * 1024 * 1024 + 1 });
  await expect(compressWithGhostScript({ bytes })).rejects.toThrow('32 MiB');
  expect(workers).toHaveLength(0);
  const operation = compressWithGhostScript({ bytes: new ArrayBuffer(3) });
  const output = new ArrayBuffer(5);
  Object.defineProperty(output, 'byteLength', { value: 64 * 1024 * 1024 + 1 });
  const rejected = expect(operation).rejects.toThrow('Invalid');
  workers[0].dispatchEvent(
    new MessageEvent('message', { data: { ok: true, bytes: output } })
  );
  await rejected;
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
});

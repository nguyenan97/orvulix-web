import { afterEach, describe, expect, it, vi } from 'vitest';
import { runRegex, type RegexWorker } from './runner';
class FakeWorker implements RegexWorker {
  onmessage: RegexWorker['onmessage'] = null;
  onerror: RegexWorker['onerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}
const input = { pattern: 'a', flags: 'g', text: 'a' };
const result = {
  matches: [{ start: 0, end: 1, captures: [], groups: [] }],
  truncated: false
};
afterEach(() => {
  vi.useRealTimers();
});
describe('disposable regex runner', () => {
  it('returns worker output, terminates it and ignores late messages', async () => {
    const worker = new FakeWorker();
    const pending = runRegex(input, undefined, { createWorker: () => worker });
    const late = worker.onmessage!;
    late({ data: { ok: true, result } } as MessageEvent);
    await expect(pending).resolves.toEqual(result);
    late({ data: { ok: false, error: 'late' } } as MessageEvent);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
  });
  it('terminates a stuck worker at the deadline', async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker();
    const pending = runRegex(input, undefined, {
      createWorker: () => worker,
      timeoutMs: 100
    });
    const rejected = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(100);
    await rejected;
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cancels pending work and skips an already-aborted request', async () => {
    const worker = new FakeWorker(),
      controller = new AbortController(),
      factory = vi.fn(() => worker);
    const pending = runRegex(input, controller.signal, {
      createWorker: factory
    });
    controller.abort();
    await expect(pending).rejects.toThrow(/cancelled/);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    await expect(
      runRegex(input, controller.signal, { createWorker: factory })
    ).rejects.toThrow(/cancelled/);
    expect(factory).toHaveBeenCalledTimes(1);
  });
  it.each(['syntax', 'worker', 'invalid-message', 'post'])(
    'cleans up on %s errors',
    async (kind) => {
      const worker = new FakeWorker();
      if (kind === 'post')
        worker.postMessage.mockImplementation(() => {
          throw new Error('post failed');
        });
      const pending = runRegex(input, undefined, {
        createWorker: () => worker
      });
      if (kind === 'syntax')
        worker.onmessage!({
          data: { ok: false, error: 'Syntax error' }
        } as MessageEvent);
      if (kind === 'worker') worker.onerror!({} as ErrorEvent);
      if (kind === 'invalid-message')
        worker.onmessage!({ data: { ok: true, result: null } } as MessageEvent);
      await expect(pending).rejects.toThrow();
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    }
  );
  it('never constructs a worker for out-of-bounds input and reports startup failure', async () => {
    const factory = vi.fn(() => new FakeWorker());
    await expect(
      runRegex({ ...input, text: 'a'.repeat(16385) }, undefined, {
        createWorker: factory
      })
    ).rejects.toThrow(/limit/);
    expect(factory).not.toHaveBeenCalled();
    await expect(
      runRegex(input, undefined, {
        createWorker: () => {
          throw new Error('Blocked');
        }
      })
    ).rejects.toThrow(/Could not start/);
  });
});

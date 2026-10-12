import { afterEach, describe, expect, it, vi } from 'vitest';
import { runList, type ListWorker } from './runner';
import { LIST_LIMITS, type ListRequest } from './model';
class FakeWorker implements ListWorker {
  onmessage: ListWorker['onmessage'] = null;
  onerror: ListWorker['onerror'] = null;
  onmessageerror: ListWorker['onmessageerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}
const request: ListRequest = {
  operation: 'reverse',
  input: 'a,b',
  options: {
    splitOperatorType: 'regex',
    splitSeparator: ',',
    joinSeparator: '|'
  }
};
afterEach(() => {
  vi.useRealTimers();
});
describe('disposable list worker lifecycle', () => {
  it('returns output and ignores late responses after terminating', async () => {
    const worker = new FakeWorker();
    const promise = runList(request, new AbortController().signal, {
      createWorker: () => worker
    });
    const late = worker.onmessage!;
    late({ data: { ok: true, result: 'b|a' } } as MessageEvent);
    await expect(promise).resolves.toBe('b|a');
    late({ data: { ok: true, result: 'stale' } } as MessageEvent);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
  });
  it('terminates a stuck worker at the deadline', async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker();
    const promise = runList(request, new AbortController().signal, {
      createWorker: () => worker
    });
    const assertion = expect(promise).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(LIST_LIMITS.timeoutMs);
    await assertion;
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('aborts pending work and never creates a worker for already-aborted input', async () => {
    const worker = new FakeWorker(),
      controller = new AbortController(),
      factory = vi.fn(() => worker);
    const promise = runList(request, controller.signal, {
      createWorker: factory
    });
    controller.abort();
    await expect(promise).rejects.toThrow(/cancelled/);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    await expect(
      runList(request, controller.signal, { createWorker: factory })
    ).rejects.toThrow(/cancelled/);
    expect(factory).toHaveBeenCalledTimes(1);
  });
  it.each(['error', 'messageerror', 'invalid', 'syntax', 'oversize', 'post'])(
    'cleans up on %s failure',
    async (kind) => {
      const worker = new FakeWorker();
      if (kind === 'post')
        worker.postMessage.mockImplementation(() => {
          throw Error('post failed');
        });
      const promise = runList(request, new AbortController().signal, {
        createWorker: () => worker
      });
      if (kind === 'error') worker.onerror!({} as ErrorEvent);
      if (kind === 'messageerror') worker.onmessageerror!({} as MessageEvent);
      if (kind === 'invalid')
        worker.onmessage!({ data: { ok: true, result: 42 } } as MessageEvent);
      if (kind === 'syntax')
        worker.onmessage!({
          data: { ok: false, error: 'Invalid regular expression' }
        } as MessageEvent);
      if (kind === 'oversize')
        worker.onmessage!({
          data: { ok: true, result: 'x'.repeat(LIST_LIMITS.outputBytes + 1) }
        } as MessageEvent);
      await expect(promise).rejects.toThrow();
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    }
  );
  it('rejects limits before factory invocation and has no UI fallback on startup failure', async () => {
    const factory = vi.fn(() => new FakeWorker());
    await expect(
      runList(
        { ...request, input: 'x'.repeat(LIST_LIMITS.inputBytes + 1) },
        new AbortController().signal,
        { createWorker: factory }
      )
    ).rejects.toThrow(/Input/);
    expect(factory).not.toHaveBeenCalled();
    await expect(
      runList(request, new AbortController().signal, {
        createWorker: () => {
          throw Error('blocked');
        }
      })
    ).rejects.toThrow(/Could not start/);
  });
});

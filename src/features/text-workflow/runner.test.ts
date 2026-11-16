import { afterEach, describe, expect, it, vi } from 'vitest';
import { newStep, LIMITS, type Recipe } from './model';
import { runWorkflow, type WorkflowWorker } from './runner';
import { checkResult, type WorkflowRequest } from './protocol';
const recipe: Recipe = { version: 1, steps: [newStep('trim')] };
class WorkerProbe implements WorkflowWorker {
  onmessage: WorkflowWorker['onmessage'] = null;
  onerror: WorkflowWorker['onerror'] = null;
  onmessageerror: WorkflowWorker['onmessageerror'] = null;
  request!: WorkflowRequest;
  terminate = vi.fn();
  postMessage(request: WorkflowRequest) {
    this.request = request;
  }
  reply(result: unknown, id = this.request.runId) {
    this.onmessage?.({ data: { runId: id, result } } as MessageEvent);
  }
}
afterEach(() => vi.useRealTimers());
describe('workflow worker ownership', () => {
  it('rejects startup that consumed the deadline without posting input', async () => {
    const clock = vi
      .spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValue(5001);
    const worker = new WorkerProbe();
    const posted = vi.spyOn(worker, 'postMessage');
    try {
      await expect(
        runWorkflow('x', recipe, new AbortController().signal, {
          createWorker: () => worker
        })
      ).rejects.toThrow('timed out');
      expect(posted).not.toHaveBeenCalled();
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    } finally {
      clock.mockRestore();
    }
  });
  it('validates before worker allocation, including exact input and pre-aborted runs', async () => {
    const createWorker = vi.fn(() => new WorkerProbe());
    await expect(
      runWorkflow(
        'x'.repeat(LIMITS.input + 1),
        recipe,
        new AbortController().signal,
        { createWorker }
      )
    ).rejects.toThrow('Input is too large');
    const controller = new AbortController();
    controller.abort();
    await expect(
      runWorkflow('x', recipe, controller.signal, { createWorker })
    ).rejects.toThrow('cancelled');
    expect(createWorker).not.toHaveBeenCalled();
  });
  it('cleans up on success and ignores captured late messages', async () => {
    const worker = new WorkerProbe();
    const promise = runWorkflow(' x ', recipe, new AbortController().signal, {
      createWorker: () => worker
    });
    const captured = worker.onmessage!;
    worker.reply({ kind: 'success', outputs: ['x'] }, -1);
    expect(worker.terminate).not.toHaveBeenCalled();
    worker.reply({ kind: 'success', outputs: ['x'] });
    await expect(promise).resolves.toEqual({ kind: 'success', outputs: ['x'] });
    captured({
      data: {
        runId: worker.request.runId,
        result: { kind: 'success', outputs: ['late'] }
      }
    } as MessageEvent);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect([worker.onmessage, worker.onerror, worker.onmessageerror]).toEqual([
      null,
      null,
      null
    ]);
  });
  it('terminates on cancellation, rejects late reply and supports a later run', async () => {
    const worker = new WorkerProbe(),
      controller = new AbortController();
    const promise = runWorkflow('x', recipe, controller.signal, {
      createWorker: () => worker
    });
    const captured = worker.onmessage!;
    controller.abort();
    await expect(promise).rejects.toThrow('cancelled');
    captured({
      data: {
        runId: worker.request.runId,
        result: { kind: 'success', outputs: ['stale'] }
      }
    } as MessageEvent);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    const next = new WorkerProbe();
    const recovery = runWorkflow('new', recipe, new AbortController().signal, {
      createWorker: () => next
    });
    next.reply({ kind: 'success', outputs: ['new'] });
    await expect(recovery).resolves.toEqual({
      kind: 'success',
      outputs: ['new']
    });
  });
  it('includes worker startup in deadline and cleans up a silent worker', async () => {
    vi.useFakeTimers();
    const worker = new WorkerProbe();
    const promise = runWorkflow('x', recipe, new AbortController().signal, {
      createWorker: () => worker
    });
    const rejection = expect(promise).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(5000);
    await rejection;
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['onerror', 'onmessageerror'] as const)(
    'cleans up %s without exposing worker errors',
    async (event) => {
      const worker = new WorkerProbe();
      const promise = runWorkflow('x', recipe, new AbortController().signal, {
        createWorker: () => worker
      });
      worker[event]?.({ message: 'private input' } as ErrorEvent &
        MessageEvent);
      await expect(promise).rejects.toThrow(
        event === 'onerror' ? 'worker failed' : 'Invalid workflow'
      );
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    }
  );
  it('sanitizes startup and postMessage exceptions', async () => {
    await expect(
      runWorkflow('x', recipe, new AbortController().signal, {
        createWorker: () => {
          throw Error('private');
        }
      })
    ).rejects.toThrow('Could not start');
    const worker = new WorkerProbe();
    worker.postMessage = () => {
      throw Error('private');
    };
    await expect(
      runWorkflow('x', recipe, new AbortController().signal, {
        createWorker: () => worker
      })
    ).rejects.toThrow('worker failed');
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it.each([
    null,
    {},
    { kind: 'success', outputs: [] },
    { kind: 'success', outputs: ['x', 'y'] },
    { kind: 'error', outputs: ['x'], failedStep: 0, error: 'invalid-base64' },
    { kind: 'error', outputs: [], failedStep: 0, error: 'private input' }
  ])('rejects malformed worker responses %#', async (result) => {
    const worker = new WorkerProbe();
    const promise = runWorkflow('x', recipe, new AbortController().signal, {
      createWorker: () => worker
    });
    worker.reply(result);
    await expect(promise).rejects.toThrow('Invalid workflow worker response');
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it('admits exact response budgets and rejects one-over output/aggregate sizes', () => {
    expect(
      checkResult(
        { kind: 'success', outputs: Array(4).fill('x'.repeat(LIMITS.output)) },
        4
      ).kind
    ).toBe('success');
    expect(() =>
      checkResult(
        { kind: 'success', outputs: ['x'.repeat(LIMITS.output + 1)] },
        1
      )
    ).toThrow('Invalid workflow');
    expect(() =>
      checkResult(
        {
          kind: 'success',
          outputs: [...Array(4).fill('x'.repeat(LIMITS.output)), 'x']
        },
        5
      )
    ).toThrow('Invalid workflow');
    expect(checkResult({ kind: 'success', outputs: [''] }, 1)).toEqual({
      kind: 'success',
      outputs: ['']
    });
  });
});

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWorkflow } from './useWorkflow';
import {
  newStep,
  WorkflowError,
  type Recipe,
  type WorkflowResult
} from './model';

const recipe: Recipe = { version: 1, steps: [newStep('trim')] };
function pending() {
  let resolve!: (result: WorkflowResult) => void,
    reject!: (error: Error) => void;
  const promise = new Promise<WorkflowResult>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
describe('React workflow ownership', () => {
  it('invalidates on source/options replacement and ignores late successes and failures', async () => {
    const first = pending(),
      second = pending();
    const runner = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const hook = renderHook(
      ({ input, config }) => useWorkflow(input, config, runner),
      { initialProps: { input: 'old', config: recipe } }
    );
    act(() => hook.result.current.run());
    const oldSignal = runner.mock.calls[0][2] as AbortSignal;
    expect(hook.result.current.running).toBe(true);
    hook.rerender({ input: 'new', config: recipe });
    expect(oldSignal.aborted).toBe(true);
    expect(hook.result.current.result).toBeNull();
    act(() => hook.result.current.run());
    await act(async () => {
      first.resolve({ kind: 'success', outputs: ['stale'] });
    });
    expect(hook.result.current.running).toBe(true);
    await act(async () => {
      second.resolve({ kind: 'success', outputs: ['new'] });
    });
    expect(hook.result.current.result).toEqual({
      kind: 'success',
      outputs: ['new']
    });
    hook.rerender({
      input: 'new',
      config: { version: 1, steps: [newStep('uppercase')] }
    });
    expect(hook.result.current.result).toBeNull();
  });
  it('cancels an earlier run and unmounts without accepting late notifications', async () => {
    const first = pending(),
      second = pending();
    const runner = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const hook = renderHook(() => useWorkflow('text', recipe, runner));
    act(() => hook.result.current.run());
    act(() => hook.result.current.run());
    expect((runner.mock.calls[0][2] as AbortSignal).aborted).toBe(true);
    await act(async () => {
      first.reject(Error('private'));
    });
    expect(hook.result.current.running).toBe(true);
    hook.unmount();
    expect((runner.mock.calls[1][2] as AbortSignal).aborted).toBe(true);
    await act(async () => {
      second.resolve({ kind: 'success', outputs: ['late'] });
    });
  });
  it('clears immediately on Cancel and recovers after a timed-out run', async () => {
    const first = pending(),
      second = pending();
    const runner = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const hook = renderHook(() => useWorkflow('text', recipe, runner));
    act(() => hook.result.current.run());
    await act(async () => {
      first.reject(new WorkflowError('timeout'));
    });
    expect(hook.result.current.result).toEqual({
      kind: 'error',
      outputs: [],
      failedStep: null,
      error: 'timeout'
    });
    act(() => hook.result.current.run());
    act(() => hook.result.current.cancel());
    expect(hook.result.current.running).toBe(false);
    expect(hook.result.current.result).toBeNull();
    await act(async () => {
      second.resolve({ kind: 'success', outputs: ['late'] });
    });
    expect(hook.result.current.result).toBeNull();
  });
});

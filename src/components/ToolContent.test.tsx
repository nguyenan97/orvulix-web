import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ToolContent from './ToolContent';
import { CustomSnackBarContext } from '../contexts/CustomSnackBarContext';

afterEach(cleanup);
const initialValues = {};
function frame(
  compute: () => void | Promise<void>,
  notice: (message: string, type: 'error' | 'success') => void,
  input = 'first'
) {
  return (
    <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
      <ToolContent
        title="Test"
        input={input}
        initialValues={initialValues}
        compute={compute}
        getGroups={null}
      />
    </CustomSnackBarContext.Provider>
  );
}
it('reports a current async rejection through the existing error notice', async () => {
  const notice = vi.fn();
  render(
    frame(async () => {
      throw new Error('Controlled failure');
    }, notice)
  );
  await waitFor(() =>
    expect(notice).toHaveBeenCalledWith('Controlled failure', 'error')
  );
  expect(notice).toHaveBeenCalledTimes(1);
});
it('retains synchronous exception handling', async () => {
  const notice = vi.fn();
  render(
    frame(() => {
      throw new Error('Sync failure');
    }, notice)
  );
  await waitFor(() =>
    expect(notice).toHaveBeenCalledWith('Sync failure', 'error')
  );
});
it('consumes old and unmounted rejections without reporting stale errors', async () => {
  const notice = vi.fn();
  const rejects: ((error: Error) => void)[] = [];
  const compute = vi.fn(
    () => new Promise<void>((_, reject) => rejects.push(reject))
  );
  const { rerender, unmount } = render(frame(compute, notice));
  await waitFor(() => expect(compute).toHaveBeenCalledTimes(1));
  rerender(frame(compute, notice, 'second'));
  await waitFor(() => expect(compute).toHaveBeenCalledTimes(2));
  rejects[0](new Error('Old input'));
  await Promise.resolve();
  expect(notice).not.toHaveBeenCalled();
  unmount();
  rejects[1](new Error('Unmounted'));
  await Promise.resolve();
  expect(notice).not.toHaveBeenCalled();
});
it('uses the latest callback without retriggering on callback identity alone', async () => {
  const notice = vi.fn();
  const first = vi.fn();
  const next = vi.fn();
  const { rerender } = render(frame(first, notice));
  rerender(frame(next, notice));
  expect(first).toHaveBeenCalledTimes(1);
  expect(next).not.toHaveBeenCalled();
  rerender(frame(next, notice, 'new input'));
  await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
});

it('invalidates errors on option edits and allows a successful retry', async () => {
  const notice = vi.fn();
  let rejectOld: (error: Error) => void = () => undefined;
  const compute = vi.fn((values: { step: number }) =>
    values.step === 0
      ? new Promise<void>((_, reject) => {
          rejectOld = reject;
        })
      : Promise.resolve()
  );
  render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
      <ToolContent
        title="Test"
        input="same"
        initialValues={{ step: 0 }}
        compute={compute}
        getGroups={({ updateField }) => [
          {
            title: 'Options',
            component: (
              <button onClick={() => updateField('step', 1)}>Retry</button>
            )
          }
        ]}
      />
    </CustomSnackBarContext.Provider>
  );
  await waitFor(() => expect(compute).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(compute).toHaveBeenCalledTimes(2));
  rejectOld(new Error('Old options'));
  await Promise.resolve();
  expect(notice).not.toHaveBeenCalled();
});

it('reports a controlled fallback for non-Error rejections', async () => {
  const notice = vi.fn();
  render(
    frame(() => Promise.reject({ privateInput: 'never log this' }), notice)
  );
  await waitFor(() =>
    expect(notice).toHaveBeenCalledWith('Tool processing failed.', 'error')
  );
});

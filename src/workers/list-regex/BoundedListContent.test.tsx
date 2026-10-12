import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BoundedListContent from './BoundedListContent';
import { runList } from './runner';
vi.mock('./runner', () => ({ runList: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const values = {
  splitOperatorType: 'regex',
  splitSeparator: ',',
  joinSeparator: '|'
};
function view(
  input: string,
  setResult: (v: string) => void,
  compute = vi.fn(),
  mode = 'regex'
) {
  return (
    <BoundedListContent
      workerOperation="reverse"
      setResult={setResult}
      title="Reverse"
      initialValues={{ ...values, splitOperatorType: mode }}
      input={input}
      compute={compute}
      getGroups={null}
      resultComponent={<div>Output</div>}
    />
  );
}
describe('list UI worker adapter', () => {
  it('clears previous output on edits, ignores late output and aborts on unmount', async () => {
    const pending: ((v: string) => void)[] = [];
    vi.mocked(runList).mockImplementation(
      () => new Promise((resolve) => pending.push(resolve))
    );
    const setResult = vi.fn();
    const { rerender, unmount } = render(view('a,b', setResult));
    await waitFor(() => expect(pending).toHaveLength(1));
    const firstSignal = vi.mocked(runList).mock.calls[0][1];
    rerender(view('c,d', setResult));
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(firstSignal.aborted).toBe(true);
    await act(async () => pending[0]('stale'));
    expect(setResult).not.toHaveBeenCalledWith('stale');
    await act(async () => pending[1]('d|c'));
    expect(setResult).toHaveBeenCalledWith('d|c');
    rerender(view('e,f', setResult));
    await waitFor(() => expect(pending).toHaveLength(3));
    expect(setResult).toHaveBeenLastCalledWith('');
    const lastSignal = vi.mocked(runList).mock.calls[2][1];
    unmount();
    expect(lastSignal.aborted).toBe(true);
    await act(async () => pending[2]('after unmount'));
    expect(setResult).not.toHaveBeenCalledWith('after unmount');
  });
  it('cancels explicitly and does not allow a late result to replace the cleared output', async () => {
    let resolve!: (v: string) => void;
    vi.mocked(runList).mockImplementation(
      () => new Promise((r) => (resolve = r))
    );
    const setResult = vi.fn();
    render(view('a,b', setResult));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel processing' })
    );
    expect(vi.mocked(runList).mock.calls[0][1].aborted).toBe(true);
    expect(await screen.findByRole('alert')).toHaveTextContent('cancelled');
    await act(async () => resolve('late'));
    expect(setResult).not.toHaveBeenCalledWith('late');
  });
  it('keeps symbol computation synchronous and skips regex compilation on empty input', async () => {
    const compute = vi.fn(),
      setResult = vi.fn();
    const { unmount } = render(view('a,b', setResult, compute, 'symbol'));
    expect(compute).toHaveBeenCalledWith(
      { ...values, splitOperatorType: 'symbol' },
      'a,b'
    );
    expect(runList).not.toHaveBeenCalled();
    unmount();
    render(view('', setResult));
    expect(runList).not.toHaveBeenCalled();
  });
});

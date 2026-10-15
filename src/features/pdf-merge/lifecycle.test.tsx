import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MergePdf from '../../pages/tools/pdf/merge-pdf';
import { mergePdf } from '../../pages/tools/pdf/merge-pdf/service';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
vi.mock('../../pages/tools/pdf/merge-pdf/service', () => ({
  mergePdf: vi.fn()
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));
// UI boundaries only: real tool/Formik effects and asynchronous merge ownership run.
vi.mock('../../components/input/ToolMultiplePdfInput', () => ({
  default: ({
    onChange
  }: {
    onChange: (value: { file: File; order: number }[]) => void;
  }) => (
    <>
      <button
        onClick={() =>
          onChange([{ file: new File(['pdf'], 'input.pdf'), order: 0 }])
        }
      >
        Select
      </button>
      <button onClick={() => onChange([])}>Clear</button>
    </>
  )
}));
vi.mock('../../components/result/ToolFileResult', () => ({
  default: ({ value, loading }: { value: File | null; loading: boolean }) => (
    <>
      <output>{value?.name ?? 'empty'}</output>
      <span>{loading ? 'busy' : 'idle'}</span>
    </>
  )
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it('does not republish a completed merge after Clear', async () => {
  let finish!: (file: File) => void;
  vi.mocked(mergePdf).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: vi.fn() }}>
      <MergePdf title="Merge PDF" />
    </CustomSnackBarContext.Provider>
  );
  fireEvent.click(screen.getByText('Select'));
  await waitFor(() => expect(mergePdf).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByText('Clear'));
  await act(async () => {
    finish(new File(['result'], 'merged.pdf'));
  });
  expect(screen.getByRole('status').textContent).toBe('empty');
  expect(screen.getByText('idle')).toBeTruthy();
});
function deferred() {
  let resolve!: (file: File) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<File>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function host() {
  return render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: vi.fn() }}>
      <MergePdf title="Merge PDF" />
    </CustomSnackBarContext.Provider>
  );
}
it.each(['success', 'error'] as const)(
  'old %s cannot stop a newer merge or publish stale state',
  async (outcome) => {
    const old = deferred(),
      next = deferred();
    vi.mocked(mergePdf)
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(next.promise);
    host();
    fireEvent.click(screen.getByText('Select'));
    await waitFor(() => expect(mergePdf).toHaveBeenCalledTimes(1));
    const oldSignal = vi.mocked(mergePdf).mock.calls[0][1]!;
    fireEvent.click(screen.getByText('Select'));
    await waitFor(() => expect(mergePdf).toHaveBeenCalledTimes(2));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
      if (outcome === 'success') old.resolve(new File(['old'], 'old.pdf'));
      else old.reject(Error('stale error'));
    });
    expect(screen.getByText('busy')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('empty');
    expect(screen.queryByRole('alert')).toBeNull();
    await act(async () => {
      next.resolve(new File(['new'], 'new.pdf'));
    });
    expect(screen.getByRole('status').textContent).toBe('new.pdf');
    expect(screen.getByText('idle')).toBeTruthy();
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.getByRole('status').textContent).toBe('empty');
  }
);
it('reports current failure, clears it on edit and recovers', async () => {
  vi.mocked(mergePdf)
    .mockRejectedValueOnce(Error('parser detail'))
    .mockResolvedValueOnce(new File(['ok'], 'merged.pdf'));
  host();
  fireEvent.click(screen.getByText('Select'));
  await screen.findByRole('alert');
  expect(screen.getByRole('alert').textContent).toContain('PDF merge failed');
  expect(screen.getByRole('alert').textContent).not.toContain('parser detail');
  fireEvent.click(screen.getByText('Select'));
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toBe('merged.pdf')
  );
  expect(screen.queryByRole('alert')).toBeNull();
});
it.each(['success', 'error'] as const)(
  'unmount aborts and consumes late %s',
  async (outcome) => {
    const job = deferred();
    vi.mocked(mergePdf).mockReturnValue(job.promise);
    const view = host();
    fireEvent.click(screen.getByText('Select'));
    await waitFor(() => expect(mergePdf).toHaveBeenCalledTimes(1));
    const signal = vi.mocked(mergePdf).mock.calls[0][1]!;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => {
      if (outcome === 'success') job.resolve(new File(['done'], 'merged.pdf'));
      else job.reject(Error('late error'));
    });
  }
);

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import HtmlToPdf from './HtmlToPdf';
import { runPaginated } from './paginated-renderer';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
import { planPagination } from './pagination';
vi.mock('./paginated-renderer', () => ({ runPaginated: vi.fn() }));
vi.mock('./assets', async (original) => ({
  ...(await original<typeof import('./assets')>()),
  validateEmbeddedImages: vi.fn(async () => {})
}));
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 0)
  );
  vi.stubGlobal('cancelAnimationFrame', (handle: number) =>
    clearTimeout(handle)
  );
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:pagination');
      static revokeObjectURL = vi.fn();
    }
  );
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
function selectMode() {
  fireEvent.mouseDown(screen.getByLabelText('PDF layout'));
  fireEvent.click(screen.getByRole('option', { name: 'Paginated' }));
}
it('owns page-plan/progress/output snapshots; rejects late callbacks/results after edits and mode switching', async () => {
  const completions: {
    resolve: (v: Awaited<ReturnType<typeof runPaginated>>) => void;
    reject: (e: Error) => void;
  }[] = [];
  vi.mocked(runPaginated).mockImplementation(
    () =>
      new Promise((resolve, reject) => completions.push({ resolve, reject }))
  );
  render(<HtmlToPdf />);
  selectMode();
  fireEvent.click(screen.getByText('Load example'));
  const button = screen.getByRole('button', { name: 'Convert to PDF' });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(completions).toHaveLength(1));
  const args = vi.mocked(runPaginated).mock.calls[0],
    plan = planPagination(
      { height: 1500, extent: 1500, blocks: [] },
      DEFAULT_OPTIONS,
      DEFAULT_PDF_OPTIONS
    );
  await act(async () => args[5]?.(plan));
  expect(screen.getByText(/pages - same source/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('HTML markup'), {
    target: { value: '<p>Edited</p>' }
  });
  expect(args[3].aborted).toBe(true);
  await act(async () => {
    args[5]?.(plan);
    args[6]?.({ stage: 'capturing', page: 2, total: 2 });
    completions[0].resolve({ plan, file: new File(['late'], 'late.pdf') });
  });
  expect(screen.queryByText(/pages - same source/)).not.toBeInTheDocument();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() => expect(completions).toHaveLength(2));
  fireEvent.mouseDown(screen.getByLabelText('PDF layout'));
  fireEvent.click(screen.getByRole('option', { name: 'One page' }));
  expect(vi.mocked(runPaginated).mock.calls[1][3].aborted).toBe(true);
  await act(async () => completions[1].reject(Error('stale failure')));
  expect(screen.queryByText('stale failure')).not.toBeInTheDocument();
});
it('preview avoids export, cancel/unmount discard late plans and clear owned output', async () => {
  let complete!: (v: Awaited<ReturnType<typeof runPaginated>>) => void;
  vi.mocked(runPaginated).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const { unmount } = render(<HtmlToPdf />);
  selectMode();
  fireEvent.click(screen.getByText('Load example'));
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  await waitFor(() => expect(runPaginated).toHaveBeenCalled());
  expect(vi.mocked(runPaginated).mock.calls[0][4]).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(vi.mocked(runPaginated).mock.calls[0][3].aborted).toBe(true);
  const plan = planPagination(
    { height: 100, extent: 100, blocks: [] },
    DEFAULT_OPTIONS,
    DEFAULT_PDF_OPTIONS
  );
  await act(async () => complete({ plan }));
  expect(screen.queryByText(/pages - same source/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
  await waitFor(() => expect(runPaginated).toHaveBeenCalledTimes(2));
  const signal = vi.mocked(runPaginated).mock.calls[1][3];
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () =>
    complete({ plan, file: new File(['late'], 'late.pdf') })
  );
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

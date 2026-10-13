import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import HtmlToPdf from './HtmlToPdf';
import { runPaginated } from './paginated-renderer';
import { planPagination } from './pagination';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
vi.mock('./paginated-renderer', () => ({ runPaginated: vi.fn() }));
vi.mock('./assets', async (original) => ({
  ...(await original<typeof import('./assets')>()),
  validateEmbeddedImages: vi.fn(async () => {})
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
function paginated() {
  fireEvent.mouseDown(screen.getByLabelText('PDF layout'));
  fireEvent.click(screen.getByRole('option', { name: 'Paginated' }));
}
it('default Off, option edits cancel ownership and late plans/errors; One page hides it and Reset/defaults clear it', async () => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0)
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:test');
      static revokeObjectURL = vi.fn();
    }
  );
  const pending: {
    resolve: (v: Awaited<ReturnType<typeof runPaginated>>) => void;
    reject: (e: Error) => void;
  }[] = [];
  vi.mocked(runPaginated).mockImplementation(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  );
  const { unmount } = render(<HtmlToPdf />);
  expect(
    screen.queryByLabelText('Repeat table headers')
  ).not.toBeInTheDocument();
  paginated();
  const checkbox = screen.getByRole('checkbox', {
    name: 'Repeat table headers'
  });
  expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByText('Load example'));
  fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
  await waitFor(() => expect(pending).toHaveLength(1));
  const args = vi.mocked(runPaginated).mock.calls[0];
  expect(args[8]).toBe(true);
  fireEvent.click(checkbox);
  expect(args[3].aborted).toBe(true);
  const plan = planPagination(
    { height: 100, extent: 100, blocks: [] },
    DEFAULT_OPTIONS,
    DEFAULT_PDF_OPTIONS
  );
  await act(async () => {
    args[5]?.(plan);
    pending[0].resolve({ plan, file: new File(['late'], 'late.pdf') });
  });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(screen.queryByText(/pages - same/)).not.toBeInTheDocument();
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  await waitFor(() => expect(pending).toHaveLength(2));
  fireEvent.click(
    screen.getByRole('button', { name: 'Restore default options' })
  );
  expect(checkbox).not.toBeChecked();
  expect(vi.mocked(runPaginated).mock.calls[1][3].aborted).toBe(true);
  await act(async () => pending[1].reject(Error('late header failure')));
  expect(screen.queryByText('late header failure')).not.toBeInTheDocument();
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(
    screen.queryByLabelText('Repeat table headers')
  ).not.toBeInTheDocument();
  paginated();
  expect(
    screen.getByRole('checkbox', { name: 'Repeat table headers' })
  ).not.toBeChecked();
  fireEvent.click(screen.getByText('Load example'));
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  await waitFor(() => expect(pending).toHaveLength(3));
  unmount();
  expect(vi.mocked(runPaginated).mock.calls[2][3].aborted).toBe(true);
  await act(async () => pending[2].resolve({ plan }));
});

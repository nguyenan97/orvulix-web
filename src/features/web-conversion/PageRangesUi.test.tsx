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
import { capturePdf } from './pdf-renderer';
vi.mock('./pdf-renderer', () => ({ capturePdf: vi.fn() }));
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

function custom(expression: string) {
  fireEvent.mouseDown(screen.getByLabelText('Pages to export'));
  fireEvent.click(screen.getByRole('option', { name: 'Custom ranges' }));
  fireEvent.change(screen.getByLabelText('Page ranges'), {
    target: { value: expression }
  });
}
const fullPlan = planPagination(
  {
    height: 1800,
    extent: 1800,
    blocks: [0, 600, 1200].map((top) => ({
      top,
      bottom: top + 600,
      kind: 'block' as const
    }))
  },
  DEFAULT_OPTIONS,
  DEFAULT_PDF_OPTIONS
);
it('custom edits abort old plans/progress/output; new run carries immutable selection and source/output mapping', async () => {
  const pending: {
    resolve: (v: Awaited<ReturnType<typeof runPaginated>>) => void;
    reject: (e: Error) => void;
  }[] = [];
  vi.mocked(runPaginated).mockImplementation(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  );
  render(<HtmlToPdf />);
  selectMode();
  custom('2');
  fireEvent.click(screen.getByText('Load example'));
  const convert = screen.getByRole('button', { name: 'Convert to PDF' });
  fireEvent.click(convert);
  fireEvent.click(convert);
  await waitFor(() => expect(pending).toHaveLength(1));
  const args = vi.mocked(runPaginated).mock.calls[0];
  expect(args[7]).toEqual({ mode: 'custom', expression: '2' });
  fireEvent.change(screen.getByLabelText('Page ranges'), {
    target: { value: '3' }
  });
  expect(args[3].aborted).toBe(true);
  await act(async () => {
    args[5]?.(fullPlan);
    args[6]?.({ stage: 'capturing', page: 1, sourcePage: 2, total: 1 });
    pending[0].resolve({
      plan: fullPlan,
      file: new File(['late'], 'late.pdf')
    });
  });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(screen.queryByText(/Selected source pages/)).not.toBeInTheDocument();
  fireEvent.click(convert);
  await waitFor(() => expect(pending).toHaveLength(2));
  const active = vi.mocked(runPaginated).mock.calls[1];
  await act(async () => {
    active[5]?.(fullPlan);
    active[6]?.({ stage: 'capturing', page: 1, sourcePage: 3, total: 1 });
  });
  expect(screen.getByRole('status')).toHaveTextContent(
    'Capturing source page 3 - output page 1 of 1'
  );
  expect(screen.getByText(/Selected source pages: 3/)).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByLabelText('Pages to export'));
  fireEvent.click(screen.getByRole('option', { name: 'All pages' }));
  expect(active[3].aborted).toBe(true);
  await act(async () => pending[1].reject(Error('late selected error')));
  expect(screen.queryByText('late selected error')).not.toBeInTheDocument();
});
it('bounds validation stays explicit; empty syntax rejects without render; One page ignores ranges and reset restores All pages', async () => {
  vi.mocked(capturePdf).mockResolvedValue(
    new File(['owned'], 'owned.pdf', { type: 'application/pdf' })
  );
  render(<HtmlToPdf />);
  expect(screen.queryByLabelText('Pages to export')).not.toBeInTheDocument();
  selectMode();
  custom('');
  fireEvent.click(screen.getByText('Load example'));
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  expect(
    await screen.findByText(/Enter custom page ranges/)
  ).toBeInTheDocument();
  expect(runPaginated).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Page ranges'), {
    target: { value: '1,3' }
  });
  expect(runPaginated).not.toHaveBeenCalled();
  fireEvent.mouseDown(screen.getByLabelText('PDF layout'));
  fireEvent.click(screen.getByRole('option', { name: 'One page' }));
  expect(screen.queryByLabelText('Page ranges')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
  expect(
    await screen.findByRole('link', { name: 'Download PDF' })
  ).toBeInTheDocument();
  expect(capturePdf).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(URL.revokeObjectURL).toHaveBeenCalled();
  selectMode();
  expect(screen.getByLabelText('Pages to export')).toHaveTextContent(
    'All pages'
  );
  expect(screen.queryByLabelText('Page ranges')).not.toBeInTheDocument();
});
it('unmount aborts a selected job and ignores late export', async () => {
  let finish!: (v: Awaited<ReturnType<typeof runPaginated>>) => void;
  vi.mocked(runPaginated).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const { unmount } = render(<HtmlToPdf />);
  selectMode();
  custom('2');
  fireEvent.click(screen.getByText('Load example'));
  fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
  await waitFor(() => expect(runPaginated).toHaveBeenCalled());
  const signal = vi.mocked(runPaginated).mock.calls[0][3];
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () =>
    finish({ plan: fullPlan, file: new File(['late'], 'late.pdf') })
  );
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

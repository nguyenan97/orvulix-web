import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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
beforeEach(() => {
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
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
function paginated() {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'PDF layout' }));
  fireEvent.click(screen.getByRole('option', { name: 'Paginated' }));
}
function checkbox() {
  return screen.getByRole('checkbox', { name: 'Repeat table headers' });
}
const plan = planPagination(
  { height: 100, extent: 100, blocks: [] },
  DEFAULT_OPTIONS,
  DEFAULT_PDF_OPTIONS
);
function pendingRun() {
  let resolve!: (v: Awaited<ReturnType<typeof runPaginated>>) => void;
  let reject!: (e: Error) => void;
  let started!: () => void;
  const ready = new Promise<void>((r) => {
    started = r;
  });
  vi.mocked(runPaginated).mockImplementation(() => {
    const pending = new Promise<Awaited<ReturnType<typeof runPaginated>>>(
      (yes, no) => {
        resolve = yes;
        reject = no;
      }
    );
    started();
    return pending;
  });
  return {
    start: async (action: 'Preview' | 'Convert to PDF') => {
      fireEvent.click(screen.getByRole('button', { name: action }));
      // Explicit renderer-entry acknowledgement, not polling the UI/clock.
      await act(async () => {
        await ready;
      });
      expect(runPaginated).toHaveBeenCalledOnce();
      return vi.mocked(runPaginated).mock.calls[0];
    },
    resolve: async (file = false) => {
      await act(async () =>
        resolve({
          plan,
          ...(file ? { file: new File(['late'], 'late.pdf') } : {})
        })
      );
    },
    reject: async () => {
      await act(async () => reject(Error('late header failure')));
    }
  };
}
it('defaults headers Off, One page hides the control and Reset clears enabled state', () => {
  render(<HtmlToPdf />);
  expect(
    screen.queryByLabelText('Repeat table headers')
  ).not.toBeInTheDocument();
  paginated();
  expect(checkbox()).not.toBeChecked();
  fireEvent.click(checkbox());
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(
    screen.queryByLabelText('Repeat table headers')
  ).not.toBeInTheDocument();
  paginated();
  expect(checkbox()).not.toBeChecked();
});
it('header option edits abort export and discard late plan/file without creating a result URL', async () => {
  const pending = pendingRun();
  render(<HtmlToPdf />);
  paginated();
  fireEvent.click(checkbox());
  fireEvent.change(screen.getByLabelText('HTML markup'), {
    target: { value: '<p>Header lifecycle</p>' }
  });
  const args = await pending.start('Convert to PDF');
  expect(args[8]).toBe(true);
  fireEvent.click(checkbox());
  expect(args[3].aborted).toBe(true);
  await act(async () => args[5]?.(plan));
  await pending.resolve(true);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(screen.queryByText(/pages - same/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Download PDF' })
  ).not.toBeInTheDocument();
});
it('Restore defaults cancels preview, clears header flag and ignores its late error', async () => {
  const pending = pendingRun();
  render(<HtmlToPdf />);
  paginated();
  fireEvent.click(checkbox());
  fireEvent.change(screen.getByLabelText('HTML markup'), {
    target: { value: '<p>Header lifecycle</p>' }
  });
  const args = await pending.start('Preview');
  expect(args[8]).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: 'Restore default options' })
  );
  expect(args[3].aborted).toBe(true);
  expect(checkbox()).not.toBeChecked();
  await pending.reject();
  expect(screen.queryByText('late header failure')).not.toBeInTheDocument();
  expect(screen.queryByText(/pages - same/)).not.toBeInTheDocument();
});
it('unmount aborts pending header preview and ignores late completion', async () => {
  const pending = pendingRun();
  const { unmount } = render(<HtmlToPdf />);
  paginated();
  fireEvent.click(checkbox());
  fireEvent.change(screen.getByLabelText('HTML markup'), {
    target: { value: '<p>Header lifecycle</p>' }
  });
  const args = await pending.start('Preview');
  unmount();
  expect(args[3].aborted).toBe(true);
  await act(async () => args[5]?.(plan));
  await pending.resolve();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(document.querySelector('[data-html-renderer]')).toBeNull();
});

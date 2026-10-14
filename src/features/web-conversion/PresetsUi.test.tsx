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
import HtmlToImage from './HtmlToImage';
import { runPaginated } from './paginated-renderer';
import { planPagination } from './pagination';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
vi.mock('./paginated-renderer', () => ({ runPaginated: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0)
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:preset');
      static revokeObjectURL = vi.fn();
    }
  );
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
function preset(label: string) {
  fireEvent.mouseDown(screen.getByLabelText('Conversion preset'));
  fireEvent.click(screen.getByRole('option', { name: label }));
}
it('applies image options without rendering, preserves input/filename and leaves options editable', () => {
  render(<HtmlToImage />);
  fireEvent.change(screen.getByLabelText('HTML markup'), {
    target: { value: '<p>My document</p>' }
  });
  fireEvent.change(screen.getByLabelText('Filename'), {
    target: { value: 'Nguyễn An' }
  });
  preset('Wide JPEG - 960 x 540');
  expect(screen.getByLabelText('HTML markup')).toHaveValue(
    '<p>My document</p>'
  );
  expect(screen.getByLabelText('Filename')).toHaveValue('Nguyễn An');
  expect(screen.getByLabelText('Width (px)')).toHaveValue(960);
  expect(screen.getByLabelText('Height (px)')).toHaveValue(540);
  expect(screen.getByLabelText('Format')).toHaveTextContent('JPEG');
  expect(screen.queryByTitle('Sanitized HTML preview')).not.toBeInTheDocument();
  expect(runPaginated).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Width (px)'), {
    target: { value: '720' }
  });
  expect(screen.getByLabelText('Width (px)')).toHaveValue(720);
  fireEvent.click(
    screen.getByRole('button', { name: 'Restore default options' })
  );
  expect(screen.getByLabelText('Width (px)')).toHaveValue(800);
});
it('preset cancels pending PDF ownership, resets ranges/headers, ignores late results and carries a fresh validated snapshot', async () => {
  const pending: {
    resolve: (value: Awaited<ReturnType<typeof runPaginated>>) => void;
    reject: (e: Error) => void;
  }[] = [];
  vi.mocked(runPaginated).mockImplementation(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  );
  const { unmount } = render(<HtmlToPdf />);
  preset('A4 portrait - Paginated');
  fireEvent.change(screen.getByLabelText('HTML markup'), {
    target: { value: '<p>Own HTML</p>' }
  });
  fireEvent.change(screen.getByLabelText('Filename'), {
    target: { value: 'Own filename' }
  });
  fireEvent.click(screen.getByLabelText('Repeat table headers'));
  fireEvent.mouseDown(screen.getByLabelText('Pages to export'));
  fireEvent.click(screen.getByRole('option', { name: 'Custom ranges' }));
  fireEvent.change(screen.getByLabelText('Page ranges'), {
    target: { value: '2' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
  await waitFor(() => expect(pending).toHaveLength(1));
  const args = vi.mocked(runPaginated).mock.calls[0];
  expect(args[7]).toEqual({ mode: 'custom', expression: '2' });
  expect(args[8]).toBe(true);
  preset('Letter landscape - Paginated');
  expect(args[3].aborted).toBe(true);
  expect(screen.getByLabelText('Repeat table headers')).not.toBeChecked();
  expect(screen.getByLabelText('Pages to export')).toHaveTextContent(
    'All pages'
  );
  expect(screen.getByLabelText('Filename')).toHaveValue('Own filename');
  expect(screen.getByLabelText('HTML markup')).toHaveValue('<p>Own HTML</p>');
  const plan = planPagination(
    { height: 100, extent: 100, blocks: [] },
    DEFAULT_OPTIONS,
    DEFAULT_PDF_OPTIONS
  );
  await act(async () => {
    args[5]?.(plan);
    args[6]?.({ stage: 'capturing', page: 1, total: 1 });
    pending[0].resolve({ plan, file: new File(['old'], 'old.pdf') });
  });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(screen.queryByText(/pages - same/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
  await waitFor(() => expect(pending).toHaveLength(2));
  const next = vi.mocked(runPaginated).mock.calls[1];
  expect(next[1]).toMatchObject({
    width: 640,
    scale: 1,
    filename: 'Own filename',
    format: 'png'
  });
  expect(next[2]).toMatchObject({ paper: 'letter', orientation: 'landscape' });
  expect(next[7]).toEqual({ mode: 'all' });
  expect(next[8]).toBe(false);
  preset('A4 portrait - One page');
  expect(next[3].aborted).toBe(true);
  await act(async () => pending[1].reject(Error('late preset error')));
  expect(screen.queryByText('late preset error')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Pages to export')).not.toBeInTheDocument();
  unmount();
});

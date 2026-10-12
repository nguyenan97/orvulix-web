import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HtmlToPdf from './HtmlToPdf';
import { capturePdf } from './pdf-renderer';
vi.mock('./pdf-renderer', () => ({ capturePdf: vi.fn() }));
// Native raster decode is covered separately with injectable decoders and real browsers.
vi.mock('./assets', async (original) => ({
  ...(await original<typeof import('./assets')>()),
  validateEmbeddedImages: vi.fn(async () => {})
}));
beforeEach(() => {
  // happy-dom 12 passes MUI's sentinel -1 to Node clearImmediate. Use a
  // browser-like RAF pair; real rendering is separately tested in Playwright.
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 0)
  );
  vi.stubGlobal('cancelAnimationFrame', (handle: number) =>
    clearTimeout(handle)
  );
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
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
describe('explicit PDF job ownership', () => {
  it('aborts a pending run on unmount and ignores its late output', async () => {
    let finish!: (v: File) => void;
    vi.mocked(capturePdf).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { unmount } = render(<HtmlToPdf />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    await waitFor(() => expect(capturePdf).toHaveBeenCalled());
    const signal = vi.mocked(capturePdf).mock.calls[0][3];
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () =>
      finish(new File(['late'], 'late.pdf', { type: 'application/pdf' }))
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('does not capture on input edits or preview', async () => {
    render(<HtmlToPdf />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(capturePdf).not.toHaveBeenCalled();
    expect(
      await screen.findByTitle('Sanitized HTML preview')
    ).toBeInTheDocument();
  });
  it('aborts edits, ignores late result, recovers and revokes result URLs', async () => {
    const pending: ((v: File) => void)[] = [];
    vi.mocked(capturePdf).mockImplementation(
      () => new Promise((resolve) => pending.push(resolve))
    );
    const { unmount } = render(<HtmlToPdf />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    await waitFor(() => expect(pending).toHaveLength(1));
    const signal = vi.mocked(capturePdf).mock.calls[0][3];
    fireEvent.change(screen.getByLabelText('HTML markup'), {
      target: { value: '<p>New</p>' }
    });
    expect(signal.aborted).toBe(true);
    await act(async () =>
      pending[0](new File(['old'], 'old.pdf', { type: 'application/pdf' }))
    );
    expect(
      screen.queryByRole('link', { name: 'Download PDF' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () =>
      pending[1](new File(['new'], 'new.pdf', { type: 'application/pdf' }))
    );
    expect(
      await screen.findByRole('link', { name: 'Download PDF' })
    ).toBeInTheDocument();
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
  it('cancels pending work, clears busy and does not accept late output', async () => {
    let finish!: (v: File) => void;
    vi.mocked(capturePdf).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(<HtmlToPdf />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    await waitFor(() => expect(capturePdf).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(vi.mocked(capturePdf).mock.calls[0][3].aborted).toBe(true);
    await act(async () =>
      finish(new File(['late'], 'late.pdf', { type: 'application/pdf' }))
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('shows invalid input and renderer failures without stale downloads', async () => {
    render(<HtmlToPdf />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    expect(
      await screen.findByText('Enter HTML or upload an HTML file.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Load example'));
    vi.mocked(capturePdf).mockRejectedValue(Error('Capture failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
    expect(await screen.findByText('Capture failed')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('double submit starts one job; margin edits discard late errors and allow recovery', async () => {
    const pending: {
      resolve: (file: File) => void;
      reject: (reason: Error) => void;
    }[] = [];
    vi.mocked(capturePdf).mockImplementation(
      () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
    );
    render(<HtmlToPdf />);
    fireEvent.click(screen.getByText('Load example'));
    const convert = screen.getByRole('button', { name: 'Convert to PDF' });
    fireEvent.click(convert);
    fireEvent.click(convert);
    await waitFor(() => expect(pending).toHaveLength(1));
    fireEvent.change(screen.getByLabelText('Left margin (mm)'), {
      target: { value: '20' }
    });
    expect(vi.mocked(capturePdf).mock.calls[0][3].aborted).toBe(true);
    await act(async () => pending[0].reject(Error('Late error')));
    expect(screen.queryByText('Late error')).not.toBeInTheDocument();
    fireEvent.click(convert);
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () =>
      pending[1].resolve(
        new File(['new'], 'new.pdf', { type: 'application/pdf' })
      )
    );
    expect(
      await screen.findByRole('link', { name: 'Download PDF' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Left margin (mm)')).toHaveValue(10);
  });
});

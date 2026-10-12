import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HtmlToImage from './HtmlToImage';
import { captureHtml } from './renderer';
vi.mock('./renderer', () => ({ captureHtml: vi.fn() }));
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
describe('explicit HTML conversion lifecycle', () => {
  it('aborts a pending run on unmount and ignores its late output', async () => {
    let finish!: (v: File) => void;
    vi.mocked(captureHtml).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { unmount } = render(<HtmlToImage />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to image' }));
    await waitFor(() => expect(captureHtml).toHaveBeenCalled());
    const signal = vi.mocked(captureHtml).mock.calls[0][2];
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () =>
      finish(new File(['late'], 'late.png', { type: 'image/png' }))
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('does not capture on input edits or preview', () => {
    render(<HtmlToImage />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(captureHtml).not.toHaveBeenCalled();
    expect(screen.getByTitle('Sanitized HTML preview')).toBeInTheDocument();
  });
  it('aborts edits, ignores late result, recovers and revokes result URLs', async () => {
    const pending: ((v: File) => void)[] = [];
    vi.mocked(captureHtml).mockImplementation(
      () => new Promise((resolve) => pending.push(resolve))
    );
    const { unmount } = render(<HtmlToImage />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to image' }));
    await waitFor(() => expect(pending).toHaveLength(1));
    const signal = vi.mocked(captureHtml).mock.calls[0][2];
    fireEvent.change(screen.getByLabelText('HTML markup'), {
      target: { value: '<p>New</p>' }
    });
    expect(signal.aborted).toBe(true);
    await act(async () =>
      pending[0](new File(['old'], 'old.png', { type: 'image/png' }))
    );
    expect(
      screen.queryByRole('link', { name: 'Download PNG' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Convert to image' }));
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () =>
      pending[1](new File(['new'], 'new.png', { type: 'image/png' }))
    );
    expect(
      await screen.findByRole('link', { name: 'Download PNG' })
    ).toBeInTheDocument();
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
  it('cancels pending work, clears busy and does not accept late output', async () => {
    let finish!: (v: File) => void;
    vi.mocked(captureHtml).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(<HtmlToImage />);
    fireEvent.click(screen.getByText('Load example'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to image' }));
    await waitFor(() => expect(captureHtml).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(vi.mocked(captureHtml).mock.calls[0][2].aborted).toBe(true);
    await act(async () =>
      finish(new File(['late'], 'late.png', { type: 'image/png' }))
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('shows invalid input and renderer failures without stale downloads', async () => {
    render(<HtmlToImage />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert to image' }));
    expect(
      await screen.findByText('Enter HTML or upload an HTML file.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Load example'));
    vi.mocked(captureHtml).mockRejectedValue(Error('Capture failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Convert to image' }));
    expect(await screen.findByText('Capture failed')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

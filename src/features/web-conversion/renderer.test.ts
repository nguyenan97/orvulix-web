import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureHtml } from './renderer';
import { DEFAULT_OPTIONS, LIMITS } from './model';
import { prepareHtml } from './sanitize';
import { toCanvas } from 'html-to-image';
import { waitFor } from '@testing-library/react';
vi.mock('html-to-image', () => ({
  toCanvas: vi.fn(() => new Promise(() => {}))
}));
afterEach(() => {
  vi.useRealTimers();
  vi.mocked(toCanvas).mockReset();
  vi.mocked(toCanvas).mockImplementation(() => new Promise(() => {}));
  document
    .querySelectorAll('[data-html-renderer]')
    .forEach((node) => node.remove());
});
describe('owned render frame lifecycle', () => {
  it('rejects clipped strict output before loading the capture engine and cleans the frame', async () => {
    const onLayout = vi.fn();
    const pending = captureHtml(
      prepareHtml('<p>Long content</p>'),
      { ...DEFAULT_OPTIONS, cropPolicy: 'reject' },
      new AbortController().signal,
      onLayout
    );
    const frame = document.querySelector('iframe[data-html-renderer]')!;
    const content =
      document.implementation.createHTMLDocument('Overflow fixture');
    Object.defineProperty(content.body, 'scrollHeight', { value: 1000 });
    Object.defineProperty(frame, 'contentDocument', { value: content });
    frame.dispatchEvent(new Event('load'));
    await expect(pending).rejects.toThrow(/Export stopped/);
    expect(onLayout).toHaveBeenCalledWith(
      expect.objectContaining({ clipped: true })
    );
    expect(toCanvas).not.toHaveBeenCalled();
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
  });
  it('discards delayed encoding after cancellation and releases the canvas', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    let encode!: BlobCallback;
    canvas.toBlob = vi.fn((callback: BlobCallback) => {
      encode = callback;
    });
    vi.mocked(toCanvas).mockResolvedValue(canvas);
    const controller = new AbortController();
    const pending = captureHtml(
      prepareHtml('<p>Test</p>'),
      DEFAULT_OPTIONS,
      controller.signal
    );
    const frame = document.querySelector('iframe[data-html-renderer]')!;
    // happy-dom does not load srcdoc; supply its ready document explicitly.
    Object.defineProperty(frame, 'contentDocument', {
      value: document.implementation.createHTMLDocument('Render fixture')
    });
    frame.dispatchEvent(new Event('load'));
    await waitFor(() => expect(canvas.toBlob).toHaveBeenCalled());
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    encode(new Blob(['late'], { type: 'image/png' }));
    await Promise.resolve();
    expect([canvas.width, canvas.height]).toEqual([0, 0]);
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
  });
  it('does not allocate a frame for rejected or already aborted runs', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      captureHtml(
        prepareHtml('<p>Test</p>'),
        DEFAULT_OPTIONS,
        controller.signal
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
    await expect(
      captureHtml(
        prepareHtml('<p>Test</p>'),
        { ...DEFAULT_OPTIONS, width: 0 },
        new AbortController().signal
      )
    ).rejects.toThrow(/Width/);
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
  });
  it('removes a pending frame immediately when cancelled', async () => {
    const controller = new AbortController();
    const pending = captureHtml(
      prepareHtml('<p>Test</p>'),
      DEFAULT_OPTIONS,
      controller.signal
    );
    expect(document.querySelector('[data-html-renderer]')).not.toBeNull();
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
  });
  it('bounds a stalled preparation and clears its deadline', async () => {
    vi.useFakeTimers();
    const pending = captureHtml(
      prepareHtml('<p>Test</p>'),
      DEFAULT_OPTIONS,
      new AbortController().signal
    );
    const assertion = expect(pending).rejects.toThrow(/too long/);
    await vi.advanceTimersByTimeAsync(LIMITS.timeoutMs);
    await assertion;
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});

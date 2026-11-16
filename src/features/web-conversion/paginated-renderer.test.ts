// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { toCanvas } from 'html-to-image';
import { runPaginated } from './paginated-renderer';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
import { prepareHtml } from './sanitize';
vi.mock('html-to-image', () => ({
  toCanvas: vi.fn(() => new Promise(() => {}))
}));
beforeEach(() => {
  // jsdom emits an about:blank load but does not implement srcdoc rendering.
  // Readiness is supplied explicitly by ready(), not by that unrelated event.
  const append = document.body.append.bind(document.body);
  vi.spyOn(document.body, 'append').mockImplementation((...nodes) => {
    for (const node of nodes)
      if (node instanceof HTMLIFrameElement)
        node.addEventListener(
          'load',
          (event) => event.stopImmediatePropagation(),
          { capture: true }
        );
    append(...nodes);
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.querySelectorAll('[data-html-renderer]').forEach((n) => n.remove());
});
function ready() {
  const frame = document.querySelector<HTMLIFrameElement>(
    '[data-html-renderer]'
  )!;
  const doc = document.implementation.createHTMLDocument();
  Object.defineProperty(doc, 'defaultView', { value: window });
  doc.body.innerHTML = '<div data-page-source><p>Text</p></div>';
  const source = doc.querySelector<HTMLElement>('[data-page-source]')!,
    p = source.firstElementChild!;
  for (const el of [source, p])
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 100,
      width: 800,
      height: 100,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });
  Object.defineProperty(frame, 'contentDocument', { value: doc });
  frame.onload?.call(frame, new Event('load'));
  return frame;
}
describe('pagination job ownership and cleanup', () => {
  it('cancels measurement immediately and cleans timer/frame', async () => {
    const controller = new AbortController();
    const pending = runPaginated(
      prepareHtml('<p>X</p>'),
      DEFAULT_OPTIONS,
      DEFAULT_PDF_OPTIONS,
      controller.signal,
      false
    );
    expect(document.querySelector('[data-html-renderer]')).not.toBeNull();
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
  });
  it('times out stalled preparation with no owned resources', async () => {
    vi.useFakeTimers();
    const pending = runPaginated(
      prepareHtml('<p>X</p>'),
      DEFAULT_OPTIONS,
      DEFAULT_PDF_OPTIONS,
      new AbortController().signal,
      false
    );
    const assertion = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
  });
  it('preview measures but never captures, and invalid options allocate nothing', async () => {
    vi.mocked(toCanvas).mockClear();
    const pending = runPaginated(
      prepareHtml('<p>X</p>'),
      DEFAULT_OPTIONS,
      DEFAULT_PDF_OPTIONS,
      new AbortController().signal,
      false
    );
    ready();
    expect((await pending).plan.pages).toHaveLength(1);
    expect(toCanvas).not.toHaveBeenCalled();
    await expect(
      runPaginated(
        prepareHtml('<p>X</p>'),
        { ...DEFAULT_OPTIONS, width: 0 },
        DEFAULT_PDF_OPTIONS,
        new AbortController().signal,
        true
      )
    ).rejects.toThrow(/Width/);
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
  });
  it('zeros late capture after cancellation without encoding', async () => {
    let finish!: (c: HTMLCanvasElement) => void;
    vi.mocked(toCanvas).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const controller = new AbortController();
    const pending = runPaginated(
      prepareHtml('<p>X</p>'),
      DEFAULT_OPTIONS,
      DEFAULT_PDF_OPTIONS,
      controller.signal,
      true
    );
    ready();
    await waitFor(() => expect(finish).toBeDefined());
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 100;
    canvas.toBlob = vi.fn();
    finish(canvas);
    await waitFor(() => expect(canvas.width).toBe(0));
    expect(canvas.height).toBe(0);
    expect(canvas.toBlob).not.toHaveBeenCalled();
  });
});

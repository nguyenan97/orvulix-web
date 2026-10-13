import { afterEach, describe, expect, it, vi } from 'vitest';
import { toCanvas } from 'html-to-image';
import { captureHtml } from './renderer';
import { DEFAULT_OPTIONS, LIMITS } from './model';
import { prepareHtml } from './sanitize';
import {
  ASSET_LIMITS,
  readEmbeddedImage,
  validateEmbeddedImages
} from './assets';
import { RASTER_FIXTURES } from './assets.fixtures';
vi.mock('html-to-image', () => ({ toCanvas: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.mocked(toCanvas).mockReset();
  document
    .querySelectorAll('[data-html-renderer]')
    .forEach((frame) => frame.remove());
});
function ready() {
  const frame = document.querySelector<HTMLIFrameElement>(
    '[data-html-renderer]'
  )!;
  Object.defineProperty(frame, 'contentDocument', {
    value: document.implementation.createHTMLDocument('Deadline fixture')
  });
  frame.dispatchEvent(new Event('load'));
}
function canvas(format = 'png') {
  const result = document.createElement('canvas');
  result.width = 800;
  result.height = 600;
  result.toBlob = vi.fn((cb: BlobCallback) =>
    cb(new Blob(['encoded'], { type: `image/${format}` }))
  );
  return result;
}
async function recover() {
  const result = canvas();
  vi.mocked(toCanvas).mockResolvedValue(result);
  const pending = captureHtml(
    prepareHtml('<p>Recovered</p>'),
    DEFAULT_OPTIONS,
    new AbortController().signal
  );
  ready();
  expect((await pending).type).toBe('image/png');
  expect([result.width, result.height]).toEqual([0, 0]);
}
describe('elapsed deadlines independent of timer delivery', () => {
  for (const format of ['png', 'jpeg'] as const) {
    for (const stage of ['capture', 'encoding'] as const) {
      it.each([LIMITS.timeoutMs, LIMITS.timeoutMs + 1])(
        `${format} ${stage}: boundary %i cleans canvas/frame/listener and permits recovery`,
        async (elapsed) => {
          vi.useFakeTimers();
          const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
          const captured = canvas(format);
          if (stage === 'encoding')
            captured.toBlob = vi.fn((cb: BlobCallback) => {
              clock.mockReturnValue(elapsed);
              cb(new Blob(['encoded'], { type: `image/${format}` }));
            });
          vi.mocked(toCanvas).mockImplementation(async () => {
            if (stage === 'capture') clock.mockReturnValue(elapsed);
            return captured;
          });
          const controller = new AbortController();
          const remove = vi.spyOn(controller.signal, 'removeEventListener');
          const pending = captureHtml(
            prepareHtml('<p>Safe</p>'),
            { ...DEFAULT_OPTIONS, format },
            controller.signal
          );
          // Only the monotonic clock advances; the timeout callback never fires.
          const assertion =
            elapsed > LIMITS.timeoutMs
              ? expect(pending).rejects.toThrow(/too long/)
              : expect(pending).resolves.toMatchObject({
                  type: `image/${format}`
                });
          ready();
          await assertion;
          expect([captured.width, captured.height]).toEqual([0, 0]);
          if (stage === 'capture' && elapsed > LIMITS.timeoutMs)
            expect(captured.toBlob).not.toHaveBeenCalled();
          expect(document.querySelector('[data-html-renderer]')).toBeNull();
          expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
          expect(vi.getTimerCount()).toBe(0);
          clock.mockReturnValue(0);
          await recover();
        }
      );
    }
  }
  it('rejects elapsed preparation before loading the capture engine', async () => {
    vi.useFakeTimers();
    const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
    const pending = captureHtml(
      prepareHtml('<p>Safe</p>'),
      DEFAULT_OPTIONS,
      new AbortController().signal
    );
    const assertion = expect(pending).rejects.toThrow(/too long/);
    clock.mockReturnValue(LIMITS.timeoutMs + 1);
    ready();
    await assertion;
    expect(toCanvas).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['timeout', 'cancel'] as const)(
    'zeros a late native canvas after %s without starting encoding',
    async (kind) => {
      vi.useFakeTimers();
      let finish!: (c: HTMLCanvasElement) => void;
      vi.mocked(toCanvas).mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const controller = new AbortController();
      const pending = captureHtml(
        prepareHtml('<p>Safe</p>'),
        DEFAULT_OPTIONS,
        controller.signal
      );
      const assertion =
        kind === 'timeout'
          ? expect(pending).rejects.toThrow(/too long/)
          : expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      ready();
      await vi.waitFor(() => expect(finish).toBeDefined());
      if (kind === 'timeout')
        await vi.advanceTimersByTimeAsync(LIMITS.timeoutMs);
      else controller.abort();
      await assertion;
      const captured = canvas();
      finish(captured);
      await vi.waitFor(() => expect(captured.width).toBe(0));
      expect(captured.height).toBe(0);
      expect(captured.toBlob).not.toHaveBeenCalled();
      expect(document.querySelector('[data-html-renderer]')).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
      await recover();
    }
  );
  it('times out stalled encoding, discards its late blob and cleans owned resources', async () => {
    vi.useFakeTimers();
    const captured = canvas();
    let finish!: BlobCallback;
    captured.toBlob = vi.fn((cb: BlobCallback) => {
      finish = cb;
    });
    vi.mocked(toCanvas).mockResolvedValue(captured);
    const pending = captureHtml(
      prepareHtml('<p>Safe</p>'),
      DEFAULT_OPTIONS,
      new AbortController().signal
    );
    const assertion = expect(pending).rejects.toThrow(/too long/);
    ready();
    await vi.waitFor(() => expect(finish).toBeDefined());
    await vi.advanceTimersByTimeAsync(LIMITS.timeoutMs);
    await assertion;
    finish(new Blob(['late'], { type: 'image/png' }));
    await vi.advanceTimersByTimeAsync(0);
    expect([captured.width, captured.height]).toEqual([0, 0]);
    expect(document.querySelector('[data-html-renderer]')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    await recover();
  });
  for (const kind of ['png', 'jpeg'] as const) {
    it.each([ASSET_LIMITS.timeoutMs, ASSET_LIMITS.timeoutMs + 1])(
      `${kind} decode: boundary %i closes bitmap and clears listener/timer before recovery`,
      async (elapsed) => {
        vi.useFakeTimers();
        const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
        const bitmap = { width: 16, height: 16, close: vi.fn() };
        const asset = readEmbeddedImage(RASTER_FIXTURES[kind])!;
        const controller = new AbortController();
        const remove = vi.spyOn(controller.signal, 'removeEventListener');
        const pending = validateEmbeddedImages(
          [asset],
          controller.signal,
          async () => {
            clock.mockReturnValue(elapsed);
            return bitmap;
          }
        );
        if (elapsed > ASSET_LIMITS.timeoutMs)
          await expect(pending).rejects.toThrow(/timed out/);
        else await expect(pending).resolves.toBeUndefined();
        expect(bitmap.close).toHaveBeenCalledOnce();
        expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
        expect(vi.getTimerCount()).toBe(0);
        clock.mockReturnValue(0);
        await validateEmbeddedImages(
          [asset],
          controller.signal,
          async () => bitmap
        );
        expect(bitmap.close).toHaveBeenCalledTimes(2);
      }
    );
  }
  it('shares one asset deadline across decodes and never starts the third image after expiry', async () => {
    vi.useFakeTimers();
    const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
    const close = vi.fn();
    const decoder = vi.fn(async () => {
      clock.mockReturnValue(decoder.mock.calls.length === 1 ? 4999 : 5001);
      return { width: 16, height: 16, close };
    });
    const asset = readEmbeddedImage(RASTER_FIXTURES.png)!;
    await expect(
      validateEmbeddedImages(
        [asset, asset, asset],
        new AbortController().signal,
        decoder
      )
    ).rejects.toThrow(/timed out/);
    expect(decoder).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});

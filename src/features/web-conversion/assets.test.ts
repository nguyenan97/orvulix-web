import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ASSET_LIMITS,
  checkAssetTotals,
  readEmbeddedImage,
  validateEmbeddedImages
} from './assets';
import { RASTER_FIXTURES } from './assets.fixtures';
const png = readEmbeddedImage(RASTER_FIXTURES.png)!;
const jpeg = readEmbeddedImage(RASTER_FIXTURES.jpeg)!;
const dataUrl = (bytes: Uint8Array, mime = 'png') =>
  `data:image/${mime};base64,${btoa(String.fromCharCode(...bytes))}`;
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('bounded embedded raster headers', () => {
  it.each([RASTER_FIXTURES.png, RASTER_FIXTURES.jpeg])(
    'reads real browser-generated raster dimensions',
    (source) => {
      const asset = readEmbeddedImage(source)!;
      expect([asset.width, asset.height]).toEqual([16, 16]);
      expect(asset.bytes.length).toBeGreaterThan(30);
    }
  );
  it.each([
    'https://blocked.test/logo.png',
    'blob:example',
    'data:image/svg+xml;base64,PHN2Zy8+',
    'data:image/gif;base64,R0lGODlh'
  ])('removes unsupported source %s', (source) =>
    expect(readEmbeddedImage(source)).toBeNull()
  );
  it.each([
    'data:image/png;base64,a',
    'data:image/png;base64,%%%%',
    'data:image/png;base64,AAAA'
  ])('rejects malformed supported data %s', (source) =>
    expect(() => readEmbeddedImage(source)).toThrow(/Invalid/)
  );
  it('rejects oversized PNG dimensions before decoding or CRC checks', () => {
    const bytes = png.bytes.slice();
    new DataView(bytes.buffer).setUint32(16, 100000);
    expect(() => readEmbeddedImage(dataUrl(bytes))).toThrow(/500000 pixels/);
  });
  it('rejects animation, compressed metadata and broken PNG chunks', () => {
    for (const kind of ['acTL', 'iCCP', 'zTXt']) {
      const bytes = png.bytes.slice();
      bytes.set(
        [...kind].map((char) => char.charCodeAt(0)),
        37
      );
      expect(() => readEmbeddedImage(dataUrl(bytes))).toThrow(
        /animation|metadata/
      );
    }
    const bytes = png.bytes.slice();
    bytes[30] ^= 1;
    expect(() => readEmbeddedImage(dataUrl(bytes))).toThrow(/checksum/);
    expect(() => readEmbeddedImage(dataUrl(png.bytes.subarray(0, 40)))).toThrow(
      /truncated|incomplete/
    );
  });
  it('rejects JPEG truncation and oversized frame headers before decoding', () => {
    expect(() =>
      readEmbeddedImage(dataUrl(jpeg.bytes.subarray(0, 30), 'jpeg'))
    ).toThrow(/segment|truncated|incomplete/);
    const bytes = jpeg.bytes.slice();
    const frame = bytes.findIndex(
      (byte, i) => byte === 255 && bytes[i + 1] === 0xc0
    );
    expect(frame).toBeGreaterThan(0);
    new DataView(bytes.buffer).setUint16(frame + 7, 30000);
    expect(() => readEmbeddedImage(dataUrl(bytes, 'jpeg'))).toThrow(
      /500000 pixels/
    );
  });
  it('handles whitespace and refuses MIME/signature mismatches and large base64', () => {
    expect(
      readEmbeddedImage(RASTER_FIXTURES.png.replace('base64,', 'base64,\n'))
        ?.width
    ).toBe(16);
    expect(() =>
      readEmbeddedImage(RASTER_FIXTURES.png.replace('image/png', 'image/jpeg'))
    ).toThrow(/JPEG signature/);
    expect(() =>
      readEmbeddedImage(
        'data:image/png;base64,' + 'A'.repeat(ASSET_LIMITS.bytes * 2)
      )
    ).toThrow(/48 KiB/);
  });
  it('caps image count, aggregate bytes and aggregate source pixels', () => {
    expect(() => checkAssetTotals(Array(5).fill(png))).toThrow(/at most 4/);
    expect(() =>
      checkAssetTotals([
        { ...png, bytes: new Uint8Array(ASSET_LIMITS.bytes + 1) }
      ])
    ).toThrow(/48 KiB/);
    expect(() =>
      checkAssetTotals(Array(3).fill({ ...png, width: 1000, height: 500 }))
    ).toThrow(/total pixel/);
  });
});
describe('native bitmap validation and cleanup', () => {
  it('decodes and closes every bitmap', async () => {
    const first = { width: 16, height: 16, close: vi.fn() },
      second = { width: 16, height: 16, close: vi.fn() };
    const decoder = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    await validateEmbeddedImages(
      [png, jpeg],
      new AbortController().signal,
      decoder
    );
    expect(decoder).toHaveBeenCalledTimes(2);
    expect(first.close).toHaveBeenCalledOnce();
    expect(second.close).toHaveBeenCalledOnce();
  });
  it('rejects decode errors, header mismatches and excessive actual dimensions', async () => {
    await expect(
      validateEmbeddedImages([png], new AbortController().signal, async () => {
        throw Error('bad decoder');
      })
    ).rejects.toThrow(/could not be decoded/);
    for (const width of [17, 5000]) {
      const close = vi.fn();
      await expect(
        validateEmbeddedImages(
          [png],
          new AbortController().signal,
          async () => ({ width, height: 16, close })
        )
      ).rejects.toThrow(/dimensions|pixels/);
      expect(close).toHaveBeenCalledOnce();
    }
  });
  it('skips cancelled input and reports unavailable native support', async () => {
    const controller = new AbortController();
    controller.abort();
    const decoder = vi.fn();
    await expect(
      validateEmbeddedImages([png], controller.signal, decoder)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(decoder).not.toHaveBeenCalled();
    vi.stubGlobal('createImageBitmap', undefined);
    await expect(
      validateEmbeddedImages([png], new AbortController().signal)
    ).rejects.toThrow(/cannot safely decode/);
  });
  it.each(['cancel', 'timeout'])(
    'closes late bitmaps after %s and never starts another decode',
    async (kind) => {
      vi.useFakeTimers();
      let finish!: (bitmap: {
        width: number;
        height: number;
        close: () => void;
      }) => void;
      const decoder = vi.fn(
        () =>
          new Promise<{ width: number; height: number; close: () => void }>(
            (resolve) => {
              finish = resolve;
            }
          )
      );
      const controller = new AbortController();
      const pending = validateEmbeddedImages(
        [png, jpeg],
        controller.signal,
        decoder
      );
      const rejected = expect(pending).rejects.toThrow(
        kind === 'cancel' ? /cancelled/ : /timed out/
      );
      if (kind === 'cancel') controller.abort();
      else await vi.advanceTimersByTimeAsync(ASSET_LIMITS.timeoutMs);
      await rejected;
      const close = vi.fn();
      finish({ width: 16, height: 16, close });
      await vi.advanceTimersByTimeAsync(0);
      expect(close).toHaveBeenCalledOnce();
      expect(decoder).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    }
  );
});

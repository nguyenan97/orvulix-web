import { beforeEach, expect, it, vi } from 'vitest';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import {
  checkMixedGeometry,
  GifInputError,
  imageGeometry,
  MIXED_GIF_LIMITS as limits,
  normalizeMixedGif
} from './mixed-input';
const fetch = vi.hoisted(() => vi.fn());
vi.mock('@ffmpeg/util', () => ({ fetchFile: fetch }));
// Header fixtures test policy/parser only. Native tests exercise actual decoders.
function png(width = 32, height = 32, animated = false) {
  const bytes = new Uint8Array(animated ? 53 : 41),
    view = new DataView(bytes.buffer);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  view.setUint32(8, 13);
  view.setUint32(12, 0x49484452);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes[24] = 8;
  bytes[25] = 6;
  view.setUint32(37, animated ? 0x6163544c : 0x49444154);
  return bytes;
}
function jpeg(width = 32, height = 32) {
  return new Uint8Array([
    255,
    216,
    255,
    192,
    0,
    8,
    8,
    height >> 8,
    height & 255,
    width >> 8,
    width & 255,
    1
  ]);
}
const file = (bytes: Uint8Array, name = 'untrusted.bin') =>
  new File([new Uint8Array(bytes)], name, { type: 'application/octet-stream' });
const frames = () => [file(png()), file(jpeg())];
const worker = {
  writeFile: vi.fn(),
  exec: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn()
};
let index = 0;
const context = () => ({
  ffmpeg: worker as unknown as FFmpeg,
  tempFile: (extension: string) => `owned-${index++}${extension}`
});
beforeEach(() => {
  vi.resetAllMocks();
  index = 0;
  fetch.mockResolvedValue(new Uint8Array([1]));
  worker.writeFile.mockResolvedValue(undefined);
  worker.exec.mockResolvedValue(0);
  worker.readFile.mockResolvedValue(png());
  worker.deleteFile.mockResolvedValue(undefined);
});
it.each(['png', 'jpeg'] as const)(
  'reads %s geometry from bytes, not extension/MIME',
  (codec) => {
    expect(
      imageGeometry(codec === 'png' ? png(320, 240) : jpeg(320, 240), codec)
    ).toEqual({ width: 320, height: 240 });
  }
);
it.each([
  new Uint8Array(),
  new Uint8Array([255, 216, 255]),
  new Uint8Array([255, 216, 255, 224, 0, 0]),
  new Uint8Array([255, 216, 255, 218, 0, 2])
])('rejects truncated or non-progressing JPEG metadata', (bytes) => {
  expect(() => imageGeometry(bytes, 'jpeg')).toThrow(GifInputError);
});
it('rejects truncated PNG, huge metadata chunk and APNG before any decoder', () => {
  for (const bytes of [png().slice(0, 20), png(32, 32, true)])
    expect(() => imageGeometry(bytes, 'png')).toThrow(GifInputError);
  const bytes = png();
  new DataView(bytes.buffer).setUint32(33, 0xffffffff);
  new DataView(bytes.buffer).setUint32(37, 0x74455874);
  expect(() => imageGeometry(bytes, 'png')).toThrow(GifInputError);
});
it.each([0, -1, NaN, Infinity, 1.5, 4097])(
  'rejects invalid edge %s',
  (width) => {
    expect(() => checkMixedGeometry([{ width, height: 1 }])).toThrow(
      GifInputError
    );
  }
);
it('accepts exact pixel budgets and rejects just over frame/total budgets', () => {
  expect(() =>
    checkMixedGeometry(Array(4).fill({ width: 2000, height: 2000 }))
  ).not.toThrow();
  expect(() => checkMixedGeometry([{ width: 2001, height: 2000 }])).toThrow(
    /4 megapixels/
  );
  expect(() =>
    checkMixedGeometry(Array(5).fill({ width: 2000, height: 2000 }))
  ).toThrow(/16 megapixels/);
});
it('leaves homogeneous and out-of-scope codec paths untouched', async () => {
  for (const files of [
    [file(png()), file(png())],
    [file(jpeg()), file(jpeg())],
    [file(new Uint8Array([1]))]
  ])
    expect(await normalizeMixedGif(files, context())).toBeNull();
  expect(worker.exec).not.toHaveBeenCalled();
});
it('normalizes all mixed frames sequentially into owned RGBA PNG paths in input order', async () => {
  const inputs = [file(png()), file(jpeg()), file(png())];
  const paths = await normalizeMixedGif(inputs, context());
  expect(fetch.mock.calls.map((c) => c[0])).toEqual(inputs);
  expect(paths).toEqual(['owned-1.png', 'owned-3.png', 'owned-5.png']);
  expect(worker.exec).toHaveBeenCalledTimes(3);
  expect(
    worker.exec.mock.calls.every(
      (c) => c[0].includes('rgba') && c[0].includes('4000000')
    )
  ).toBe(true);
  expect(worker.deleteFile).toHaveBeenCalledTimes(3);
});
it('rejects mixed unsupported formats rather than silently dropping them', async () => {
  await expect(
    normalizeMixedGif([...frames(), file(new Uint8Array([1]))], context())
  ).rejects.toThrow(/Remove other/);
  expect(worker.writeFile).not.toHaveBeenCalled();
});
it.each(['count', 'file', 'total'] as const)(
  'rejects %s byte/count admission before writes',
  async (kind) => {
    let files = frames();
    if (kind === 'count')
      files = Array.from({ length: 21 }, (_, i) =>
        file(i % 2 ? png() : jpeg())
      );
    if (kind === 'file')
      Object.defineProperty(files[0], 'size', { value: limits.inputFile + 1 });
    if (kind === 'total') {
      files = [...frames(), ...frames(), file(png())];
      files.forEach((f) =>
        Object.defineProperty(f, 'size', { value: limits.inputFile })
      );
    }
    await expect(normalizeMixedGif(files, context())).rejects.toThrow(
      /64 MiB combined/
    );
    expect(worker.writeFile).not.toHaveBeenCalled();
  }
);
it('rejects oversized header geometry before writes', async () => {
  await expect(
    normalizeMixedGif([file(png(4001, 2000)), file(jpeg())], context())
  ).rejects.toThrow(/4 megapixels/);
  expect(worker.exec).not.toHaveBeenCalled();
});
it('rejects decode error, non-RGBA output and unequal decoded dimensions', async () => {
  worker.exec.mockResolvedValueOnce(1);
  await expect(normalizeMixedGif(frames(), context())).rejects.toThrow(
    /could not be decoded/
  );
  const bytes = png();
  bytes[25] = 2;
  worker.readFile.mockResolvedValueOnce(bytes);
  await expect(normalizeMixedGif(frames(), context())).rejects.toThrow(/RGBA/);
  worker.readFile
    .mockResolvedValueOnce(png())
    .mockResolvedValueOnce(png(64, 32));
  await expect(normalizeMixedGif(frames(), context())).rejects.toThrow(
    /equal decoded/
  );
});
it('rejects per-file and cumulative normalized bytes', async () => {
  worker.readFile.mockResolvedValueOnce(
    new Uint8Array(limits.normalizedFile + 1)
  );
  await expect(normalizeMixedGif(frames(), context())).rejects.toThrow(
    /20 MiB/
  );
  const large = new Uint8Array(17 * 1024 * 1024);
  large.set(png());
  worker.readFile.mockResolvedValue(large);
  await expect(
    normalizeMixedGif([...frames(), ...frames()], context())
  ).rejects.toThrow(/64 MiB/);
});
it.each(['fetch', 'write', 'exec', 'read', 'delete'] as const)(
  'checks abort after normalization %s before continuing',
  async (boundary) => {
    const c = new AbortController();
    if (boundary === 'fetch')
      fetch.mockImplementationOnce(async () => {
        c.abort();
        return new Uint8Array([1]);
      });
    if (boundary === 'write')
      worker.writeFile.mockImplementationOnce(async () => c.abort());
    if (boundary === 'exec')
      worker.exec.mockImplementationOnce(async () => {
        c.abort();
        return 0;
      });
    if (boundary === 'read')
      worker.readFile.mockImplementationOnce(async () => {
        c.abort();
        return png();
      });
    if (boundary === 'delete')
      worker.deleteFile.mockImplementationOnce(async () => c.abort());
    await expect(
      normalizeMixedGif(frames(), context(), c.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledOnce();
  }
);

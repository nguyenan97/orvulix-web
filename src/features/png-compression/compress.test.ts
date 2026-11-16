import { beforeEach, describe, expect, it, vi } from 'vitest';
import Jimp from 'jimp';
import imageCompression from 'browser-image-compression';
import { compressPng, inspectPng, PNG_LIMITS } from './compress';
vi.mock('browser-image-compression', () => ({ default: vi.fn() }));

async function fixture(
  width = 16,
  height = 16,
  noise = false,
  type = 'image/png'
) {
  const image = new Jimp(width, height, 0xff0000ff);
  if (noise)
    image.scan(0, 0, width, height, (x, y, index) => {
      image.bitmap.data[index] = (x * 17 + y * 31) % 256;
      image.bitmap.data[index + 1] = (x * 41 + y * 11) % 256;
    });
  return new File(
    [new Uint8Array(await image.getBufferAsync(Jimp.MIME_PNG))],
    'ảnh.png',
    { type }
  );
}
const signal = () => new AbortController().signal;
beforeEach(() => vi.resetAllMocks());
describe('dimension-preserving PNG service', () => {
  it('reads real PNG geometry and rejects signature/truncation/oversized geometry before decoding', async () => {
    const bytes = new Uint8Array(await (await fixture()).arrayBuffer());
    expect(inspectPng(bytes)).toEqual({ width: 16, height: 16 });
    expect(() => inspectPng(bytes.subarray(0, 32))).toThrow(/static PNG/);
    expect(() => inspectPng(bytes.subarray(0, bytes.length - 1))).toThrow(
      /truncated/
    );
    for (const [w, h] of [
      [0, 16],
      [4097, 16],
      [3000, 3000]
    ]) {
      const huge = bytes.slice();
      const view = new DataView(huge.buffer);
      view.setUint32(16, w);
      view.setUint32(20, h);
      expect(() => inspectPng(huge)).toThrow(/4096/);
    }
    const invalid = bytes.slice();
    invalid[0] = 0;
    expect(() => inspectPng(invalid)).toThrow(/static PNG/);
  });
  it('rejects animation, non-progressing malformed chunks and trailing data', async () => {
    const bytes = new Uint8Array(await (await fixture()).arrayBuffer());
    const animated = bytes.slice();
    animated.set(new TextEncoder().encode('acTL'), 37);
    expect(() => inspectPng(animated)).toThrow(/Animated/);
    const bad = bytes.slice();
    new DataView(bad.buffer).setUint32(33, 0xffffffff);
    expect(() => inspectPng(bad)).toThrow(/truncated/);
    expect(() => inspectPng(new Uint8Array([...bytes, 0]))).toThrow(/ending/);
    const many = new Uint8Array(bytes.length + PNG_LIMITS.chunks * 12);
    many.set(bytes.subarray(0, 33));
    for (let i = 0; i < PNG_LIMITS.chunks; i++)
      many.set(new TextEncoder().encode('tEXt'), 33 + i * 12 + 4);
    many.set(bytes.subarray(33), 33 + PNG_LIMITS.chunks * 12);
    expect(() => inspectPng(many)).toThrow(/excessive/);
  });
  it('retains the original when encoded output would inflate its size, including empty MIME normalization', async () => {
    const original = await fixture(16, 16, false, '');
    vi.mocked(imageCompression).mockResolvedValue(await fixture(16, 16, true));
    const result = await compressPng(original, 50, signal());
    expect(result.size).toBe(original.size);
    expect(result.name).toBe('ảnh.png');
    expect(result.type).toBe('image/png');
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(
      new Uint8Array(await original.arrayBuffer())
    );
  });
  it('accepts smaller output only with identical geometry and keeps Unicode filename', async () => {
    const original = await fixture(16, 16, true);
    vi.mocked(imageCompression).mockResolvedValue(await fixture());
    const result = await compressPng(original, 50, signal());
    expect(result.size).toBeLessThan(original.size);
    expect(result.name).toBe(original.name);
    expect(inspectPng(new Uint8Array(await result.arrayBuffer()))).toEqual({
      width: 16,
      height: 16
    });
    vi.mocked(imageCompression).mockResolvedValue(await fixture(1, 1));
    await expect(compressPng(original, 50, signal())).rejects.toThrow(
      /dimensions/
    );
  });
  it('rejects invalid options and input bytes without launching the encoder', async () => {
    const original = await fixture();
    for (const quality of [0, 101, NaN, Infinity, 1.5])
      await expect(compressPng(original, quality, signal())).rejects.toThrow(
        /integer/
      );
    Object.defineProperty(original, 'size', { value: PNG_LIMITS.bytes + 1 });
    await expect(compressPng(original, 50, signal())).rejects.toThrow(/16 MiB/);
    expect(imageCompression).not.toHaveBeenCalled();
  });
  it('rejects aborted jobs before and after asynchronous encoding', async () => {
    const original = await fixture(16, 16, true);
    const controller = new AbortController();
    controller.abort();
    await expect(
      compressPng(original, 50, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(imageCompression).not.toHaveBeenCalled();
    const running = new AbortController();
    vi.mocked(imageCompression).mockImplementation(async () => {
      running.abort();
      return fixture();
    });
    await expect(
      compressPng(original, 50, running.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

import { expect, it } from 'vitest';
import { GifWriter } from 'omggif';
import { inspectGifFixture } from './inspect-gif';
it('reads literal metadata and composites a delta frame without erasing unchanged pixels', () => {
  const bytes = new Uint8Array(4096);
  const writer = new GifWriter(bytes, 32, 32, {
    loop: 0,
    palette: [0xff0000, 0x0000ff]
  });
  writer.addFrame(0, 0, 32, 32, Array<number>(1024).fill(0), {
    delay: 12,
    disposal: 1
  });
  writer.addFrame(16, 16, 1, 1, [1], { delay: 8, disposal: 1 });
  expect(inspectGifFixture(bytes.slice(0, writer.end()))).toEqual({
    width: 32,
    height: 32,
    frames: 2,
    loop: 0,
    delays: [12, 8],
    centers: [
      [255, 0, 0, 255],
      [0, 0, 255, 255]
    ],
    corners: [
      [255, 0, 0, 255],
      [255, 0, 0, 255]
    ]
  });
});
it('rejects bytes that are not a GIF rather than returning empty success', () => {
  expect(() => inspectGifFixture(new Uint8Array([1, 2, 3]))).toThrow();
});

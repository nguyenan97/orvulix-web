import { GifReader } from 'omggif';
/** Test fixtures sample (16,16) and (0,0), retaining delta-frame pixels.
 * Not a general-purpose animation player: disposal restoration is not simulated.
 */
export function inspectGifFixture(bytes: Uint8Array) {
  const gif = new GifReader(bytes);
  const pixels = new Uint8Array(gif.width * gif.height * 4);
  const centers: number[][] = [],
    corners: number[][] = [],
    delays: number[] = [];
  for (let i = 0; i < gif.numFrames(); i++) {
    delays.push(gif.frameInfo(i).delay);
    gif.decodeAndBlitFrameRGBA(i, pixels);
    const offset = (16 * gif.width + 16) * 4;
    centers.push(Array.from(pixels.subarray(offset, offset + 4)));
    corners.push(Array.from(pixels.subarray(0, 4)));
  }
  return {
    width: gif.width,
    height: gif.height,
    frames: gif.numFrames(),
    loop: gif.loopCount(),
    delays,
    centers,
    corners
  };
}

import { checkSize } from './png';
import { optimizePng } from './optimize';
self.onmessage = async ({ data }: MessageEvent<{ file: File }>) => {
  try {
    checkSize(data.file.size);
    const output = await optimizePng(
      new Uint8Array(await data.file.arrayBuffer())
    );
    self.postMessage({ bytes: output.buffer }, { transfer: [output.buffer] });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : 'PNG optimization failed.'
    });
  }
};

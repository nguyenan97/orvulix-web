import { hashFile } from './hash';
import type { Algorithm } from './model';

self.onmessage = async ({
  data
}: MessageEvent<{ file: File; algorithm: Algorithm }>) => {
  try {
    self.postMessage({ digest: await hashFile(data.file, data.algorithm) });
  } catch {
    self.postMessage({ error: true });
  }
};

import { checkAlgorithm, checkSize, type Algorithm } from './model';

export async function hashFile(
  file: Blob,
  algorithm: Algorithm
): Promise<string> {
  checkAlgorithm(algorithm);
  checkSize(file.size);
  if (!globalThis.crypto?.subtle)
    throw Error(
      'Web Crypto unavailable. Open this tool over HTTPS or localhost.'
    );
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

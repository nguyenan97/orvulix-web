import { LIMITS, join, parsePng, replaceData, validateSamples } from './png';
class BudgetError extends Error {}
async function collect(stream: ReadableStream<Uint8Array>, limit: number) {
  const reader = stream.getReader(),
    parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit)
        throw new BudgetError(
          'PNG expansion exceeds its declared length or output budget.'
        );
      parts.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return join(parts);
}
export async function optimizePng(bytes: Uint8Array<ArrayBuffer>) {
  const png = parsePng(bytes);
  if (
    typeof CompressionStream !== 'function' ||
    typeof DecompressionStream !== 'function'
  )
    throw Error(
      'Native compression streams unavailable. Use an updated browser.'
    );
  const compressed = join(
    png.chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)
  );
  const raw = await collect(
    new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream('deflate')),
    png.expected
  );
  validateSamples(raw, png);
  let candidate: Uint8Array<ArrayBuffer>;
  try {
    const encoded = await collect(
      new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate')),
      LIMITS.bytes
    );
    candidate = replaceData(png, encoded);
  } catch (error) {
    if (!(error instanceof BudgetError)) throw error;
    return bytes;
  }
  return candidate.length < bytes.length ? candidate : bytes;
}

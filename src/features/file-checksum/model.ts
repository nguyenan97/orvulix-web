export const MAX_FILE_BYTES = 64 * 1024 * 1024;
export const TIMEOUT_MS = 30_000;
export type Algorithm = 'SHA-256' | 'SHA-512';
export function checkAlgorithm(value: unknown): asserts value is Algorithm {
  if (value !== 'SHA-256' && value !== 'SHA-512')
    throw Error('Choose SHA-256 or SHA-512.');
}
export function checkSize(size: number): void {
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES)
    throw Error('Choose a file no larger than 64 MiB.');
}
export function isDigest(
  value: unknown,
  algorithm: Algorithm
): value is string {
  return (
    typeof value === 'string' &&
    value.length === (algorithm === 'SHA-256' ? 64 : 128) &&
    /^[0-9a-f]+$/.test(value)
  );
}
export type Comparison = 'empty' | 'invalid' | 'pending' | 'match' | 'mismatch';
export function compareChecksum(
  expected: string,
  digest: string,
  algorithm: Algorithm
): Comparison {
  const normalized = expected.trim().toLowerCase();
  if (!normalized) return 'empty';
  if (!isDigest(normalized, algorithm)) return 'invalid';
  if (!digest) return 'pending';
  return normalized === digest ? 'match' : 'mismatch';
}

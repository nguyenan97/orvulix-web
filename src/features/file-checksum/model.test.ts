import { describe, expect, it } from 'vitest';
import {
  checkAlgorithm,
  checkSize,
  compareChecksum,
  MAX_FILE_BYTES
} from './model';

describe('checksum admission and comparison', () => {
  it('admits empty files and the exact limit, rejects unsafe or oversized sizes', () => {
    expect(() => checkSize(0)).not.toThrow();
    expect(() => checkSize(MAX_FILE_BYTES)).not.toThrow();
    for (const size of [MAX_FILE_BYTES + 1, -1, NaN, Infinity, 1.5])
      expect(() => checkSize(size)).toThrow('64 MiB');
    expect(() => checkAlgorithm('MD5')).toThrow();
  });
  it('distinguishes optional, invalid, pending, matching and mismatching checksums', () => {
    const digest = 'ab'.repeat(32);
    expect(compareChecksum('  ', digest, 'SHA-256')).toBe('empty');
    expect(
      compareChecksum(` \n${digest.toUpperCase()}\t`, digest, 'SHA-256')
    ).toBe('match');
    expect(compareChecksum('cd'.repeat(32), digest, 'SHA-256')).toBe(
      'mismatch'
    );
    expect(compareChecksum(digest, '', 'SHA-256')).toBe('pending');
    for (const value of [
      'a'.repeat(63),
      'g'.repeat(64),
      digest + 'a',
      'ab '.repeat(32)
    ])
      expect(compareChecksum(value, digest, 'SHA-256')).toBe('invalid');
    expect(compareChecksum(digest, '', 'SHA-512')).toBe('invalid');
    expect(
      compareChecksum('ab'.repeat(64).toUpperCase(), 'ab'.repeat(64), 'SHA-512')
    ).toBe('match');
  });
});

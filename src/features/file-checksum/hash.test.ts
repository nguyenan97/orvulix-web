// @vitest-environment node
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { hashFile } from './hash';
import { MAX_FILE_BYTES } from './model';

describe('file byte digests', () => {
  it('hashes the empty SHA-256 and abc SHA-256/SHA-512 vectors', async () => {
    expect(await hashFile(new Blob([]), 'SHA-256')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
    expect(await hashFile(new Blob(['abc']), 'SHA-256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
    expect(await hashFile(new Blob(['abc']), 'SHA-512')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
    );
  });
  it('hashes binary bytes without text decoding', async () => {
    const bytes = new Uint8Array([0, 255, 128, 13, 10, 0, 65]);
    for (const algorithm of ['SHA-256', 'SHA-512'] as const)
      expect(await hashFile(new Blob([bytes]), algorithm)).toBe(
        createHash(algorithm.replace('-', '').toLowerCase())
          .update(bytes)
          .digest('hex')
      );
  });
  it('rejects oversized input before reading and propagates read failure', async () => {
    const read = vi.fn();
    await expect(
      hashFile(
        { size: MAX_FILE_BYTES + 1, arrayBuffer: read } as unknown as Blob,
        'SHA-256'
      )
    ).rejects.toThrow('64 MiB');
    expect(read).not.toHaveBeenCalled();
    await expect(
      hashFile(
        {
          size: 1,
          arrayBuffer: () => Promise.reject(Error('read failed'))
        } as unknown as Blob,
        'SHA-256'
      )
    ).rejects.toThrow('read failed');
  });
});

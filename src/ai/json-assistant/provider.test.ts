import { describe, expect, it, vi } from 'vitest';
import { sampleProvider } from './provider';
import { SAMPLES } from './samples';

describe('honest sample provider', () => {
  it('returns authored results only for matching fixtures, independently of key order', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      const input = Object.fromEntries(
        Object.entries(SAMPLES[0].input).reverse()
      );
      const result = await sampleProvider.explain({
        input: JSON.stringify(input)
      });
      expect(result.source).toBe('authored-sample');
      expect(result.explanation).toBe(SAMPLES[0].explanation);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
  it('rejects custom input, cancellation and simulated errors instead of fabricating results', async () => {
    await expect(
      sampleProvider.explain({ input: '{"new":true}' })
    ).rejects.toThrow(/No sample explanation/);
    await expect(
      sampleProvider.explain({ input: '{}', simulateError: true })
    ).rejects.toThrow(/Simulated demo error/);
    const controller = new AbortController();
    const pending = sampleProvider.explain({
      input: '{}',
      signal: controller.signal
    });
    controller.abort();
    await expect(pending).rejects.toThrow(/cancelled/);
  });
});

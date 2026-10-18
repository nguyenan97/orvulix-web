import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

it('does not log a PDF password or the raw worker request', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  let receive: (event: { data: unknown }) => void = () => {};
  vi.stubGlobal('self', {
    addEventListener: (type: string, callback: typeof receive) => {
      expect(type).toBe('message');
      receive = callback;
    }
  });
  vi.stubGlobal(
    'XMLHttpRequest',
    class {
      open() {}
      send() {}
    }
  );
  await import('./background-worker.js');
  const password = 'synthetic-private-document-password';
  receive({
    data: {
      target: 'wasm',
      data: { type: 'protect-pdf', password, psDataURL: 'blob:local-pdf' }
    }
  });
  // Observe the real message handler. XHR is held before codec startup; this
  // verifies logging privacy, not PDF encryption or the external WASM engine.
  expect(JSON.stringify(log.mock.calls)).not.toContain(password);
  expect(JSON.stringify(log.mock.calls)).not.toContain('blob:local-pdf');
});

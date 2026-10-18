import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./gs-worker.js', () => ({}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

it('does not log a PDF password or the raw worker request', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => undefined))
  );
  let receive: (event: { data: unknown }) => void = () => {};
  vi.stubGlobal('self', {
    postMessage: vi.fn(),
    addEventListener: (type: string, callback: typeof receive) => {
      expect(type).toBe('message');
      receive = callback;
    }
  });
  await import('./background-worker.js');
  const password = 'synthetic-private-document-password';
  receive({
    data: {
      target: 'wasm',
      data: {
        type: 'protect-pdf',
        password,
        bytes: new Uint8Array([1, 2, 3]).buffer
      }
    }
  });
  // Observe the real message handler. Only codec startup is mocked; this
  // verifies logging privacy, not PDF encryption or the external WASM engine.
  expect(JSON.stringify(log.mock.calls)).not.toContain(password);
  expect(log).not.toHaveBeenCalled();
});

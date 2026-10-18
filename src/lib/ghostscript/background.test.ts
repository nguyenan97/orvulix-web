import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./gs-worker.js', () => {
  throw new Error('Synthetic codec import failure');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

it.each(['http', 'network', 'empty', 'header-size', 'import'])(
  'returns one controlled failure on %s startup error without logging input',
  async (mode) => {
    let receive: (event: { data: unknown }) => void = () => undefined;
    const post = vi.fn();
    vi.stubGlobal('self', {
      postMessage: post,
      addEventListener: (_type: string, handler: typeof receive) => {
        receive = handler;
      }
    });
    const response = {
      ok: mode !== 'http',
      headers: new Headers(
        mode === 'header-size'
          ? { 'content-length': String(32 * 1024 * 1024 + 1) }
          : {}
      ),
      arrayBuffer: async () => new ArrayBuffer(mode === 'empty' ? 0 : 3)
    };
    const fetch = vi.fn();
    if (mode === 'network')
      fetch.mockRejectedValue(new Error('Synthetic network failure'));
    else fetch.mockResolvedValue(response);
    vi.stubGlobal('fetch', fetch);
    const logs = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'error'),
      vi.spyOn(console, 'warn')
    ];
    await import('./background-worker.js');
    receive({
      data: {
        target: 'wasm',
        data: {
          bytes: new ArrayBuffer(3),
          type: 'protect-pdf',
          password: 'synthetic-secret'
        }
      }
    });
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith({ ok: false }));
    expect(post).toHaveBeenCalledTimes(1);
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  }
);

import { expect, it, vi } from 'vitest';
import { createEngine } from './engine';
function setup() {
  const worker = {
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn()
  } as unknown as Worker;
  const controller = new AbortController();
  const progress = vi.fn();
  const engine = createEngine(controller.signal, progress, () => worker);
  return { worker, controller, engine, progress };
}
it.each(['abort', 'error', 'messageerror', 'reject', 'send'])(
  'settles startup %s and releases the actual worker once',
  async (mode) => {
    const s = setup();
    if (mode === 'send')
      vi.mocked(s.worker.postMessage).mockImplementation(() => {
        throw Error();
      });
    const pending = s.engine.initialize('vie');
    const assertion = expect(pending).rejects.toThrow();
    const message = s.worker.onmessage;
    if (mode === 'abort') s.controller.abort();
    if (mode === 'error') s.worker.onerror!({} as ErrorEvent);
    if (mode === 'messageerror') s.worker.onmessageerror!({} as MessageEvent);
    if (mode === 'reject')
      message!.call(s.worker, {
        data: { jobId: '1', action: 'load', status: 'reject' }
      } as MessageEvent);
    await assertion;
    message?.call(s.worker, {
      data: { jobId: '1', action: 'load', status: 'resolve', data: {} }
    } as MessageEvent);
    s.engine.close();
    expect(s.worker.terminate).toHaveBeenCalledOnce();
    expect(s.worker.onmessage).toBeNull();
  }
);
it('initializes chosen pinned models without persistence, ignores foreign jobs and recognizes sequential text', async () => {
  const s = setup();
  const reply = async (action: string, data: unknown = {}) => {
    const sent = vi.mocked(s.worker.postMessage).mock.calls.at(-1)![0];
    expect(sent.action).toBe(action);
    s.worker.onmessage!.call(s.worker, {
      data: { ...sent, status: 'resolve', data }
    } as MessageEvent);
    await Promise.resolve();
    await Promise.resolve();
  };
  const start = s.engine.initialize('eng+vie');
  const message = s.worker.onmessage!;
  message.call(s.worker, {
    data: { jobId: 'other', action: 'load', status: 'reject' }
  } as MessageEvent);
  expect(s.worker.terminate).not.toHaveBeenCalled();
  await reply('load');
  for (const code of ['eng', 'vie']) {
    const sent = vi.mocked(s.worker.postMessage).mock.calls.at(-1)![0];
    expect(sent.payload.langs).toBe(code);
    expect(sent.payload.options).toMatchObject({
      cacheMethod: 'none',
      langPath: expect.stringContaining(`${code}@1.0.0`)
    });
    await reply('loadLanguage');
  }
  expect(
    vi.mocked(s.worker.postMessage).mock.calls.at(-1)![0].payload.langs
  ).toBe('vie+eng');
  await reply('initialize');
  await start;
  const recognition = s.engine.recognize(new Uint8Array([1]));
  await reply('recognize', { text: 'Xin chào' });
  await expect(recognition).resolves.toBe('Xin chào');
  s.engine.close();
  expect(s.worker.terminate).toHaveBeenCalledOnce();
});
it('does not start already-aborted work and reports worker-construction failure', () => {
  const controller = new AbortController();
  controller.abort();
  const factory = vi.fn();
  expect(() => createEngine(controller.signal, vi.fn(), factory)).toThrow();
  expect(factory).not.toHaveBeenCalled();
  expect(() =>
    createEngine(new AbortController().signal, vi.fn(), () => {
      throw Error('startup');
    })
  ).toThrow('startup');
});

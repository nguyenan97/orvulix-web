import { afterEach, expect, it, vi } from 'vitest';
import { runBatch } from './run';
import { createEngine } from './engine';
vi.mock('./engine', () => ({ createEngine: vi.fn() }));
afterEach(() => vi.mocked(createEngine).mockReset());
function png(width = 10, height = 10) {
  const bytes = new Uint8Array(57);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const v = new DataView(bytes.buffer);
  v.setUint32(8, 13);
  v.setUint32(12, 0x49484452);
  v.setUint32(16, width);
  v.setUint32(20, height);
  v.setUint32(37, 0x49444154);
  v.setUint32(49, 0x49454e44);
  return new File([bytes], 'fixture.png');
}
it('preflights every image before starting the codec and rejects aborted work', async () => {
  await expect(
    runBatch([png(), png(5000)], 'vie', new AbortController().signal, vi.fn())
  ).rejects.toThrow('4096');
  expect(createEngine).not.toHaveBeenCalled();
  const controller = new AbortController();
  controller.abort();
  await expect(
    runBatch([png()], 'eng', controller.signal, vi.fn())
  ).rejects.toThrow();
  expect(createEngine).not.toHaveBeenCalled();
});
it.each(['model', 'decode', 'per-image', 'total'])(
  'discards a failed %s batch and closes the engine',
  async (mode) => {
    const engine = {
      initialize: vi.fn().mockResolvedValue(undefined),
      recognize: vi.fn().mockResolvedValue('a'),
      close: vi.fn()
    };
    if (mode === 'model') engine.initialize.mockRejectedValue(Error('model'));
    if (mode === 'decode') engine.recognize.mockRejectedValue(Error('decode'));
    if (mode === 'per-image')
      engine.recognize.mockResolvedValue('x'.repeat(100_001));
    if (mode === 'total')
      engine.recognize.mockResolvedValue('x'.repeat(100_000));
    vi.mocked(createEngine).mockReturnValue(engine);
    await expect(
      runBatch(
        Array(mode === 'total' ? 6 : 1).fill(png()),
        'eng',
        new AbortController().signal,
        vi.fn()
      )
    ).rejects.toThrow();
    expect(engine.close).toHaveBeenCalledOnce();
  }
);
it.each(['cancel', 'message-error', 'invalid', 'send'])(
  'cancels or rejects ZIP %s without stale output and releases it once',
  async (mode) => {
    const engine = {
      initialize: vi.fn().mockResolvedValue(undefined),
      recognize: vi.fn().mockResolvedValue('current'),
      close: vi.fn()
    };
    vi.mocked(createEngine).mockReturnValue(engine);
    const worker = {
      onmessage: null,
      onerror: null,
      onmessageerror: null,
      postMessage: vi.fn(),
      terminate: vi.fn()
    } as unknown as Worker;
    if (mode === 'send')
      vi.mocked(worker.postMessage).mockImplementation(() => {
        throw Error();
      });
    vi.stubGlobal(
      'Worker',
      vi.fn(function () {
        return worker;
      })
    );
    try {
      const controller = new AbortController();
      const pending = runBatch([png()], 'eng', controller.signal, vi.fn());
      const assertion = expect(pending).rejects.toThrow();
      for (let i = 0; i < 12; i++) await Promise.resolve();
      expect(worker.postMessage).toHaveBeenCalledOnce();
      const message = worker.onmessage;
      if (mode === 'cancel') controller.abort();
      if (mode === 'message-error') worker.onmessageerror!({} as MessageEvent);
      if (mode === 'invalid')
        message!.call(worker, {
          data: { bytes: new ArrayBuffer(30) }
        } as MessageEvent);
      await assertion;
      message?.call(worker, {
        data: { bytes: new ArrayBuffer(40) }
      } as MessageEvent);
      expect(worker.terminate).toHaveBeenCalledOnce();
      expect(engine.close).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  }
);

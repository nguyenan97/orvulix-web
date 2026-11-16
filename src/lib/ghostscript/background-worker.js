import { COMPRESS_ACTION, PROTECT_ACTION } from './worker-init';

let settled = false;
function fail() {
  if (settled) return;
  settled = true;
  self.postMessage({ ok: false });
}

self.addEventListener('message', ({ data: request }) => {
  if (request?.target !== 'wasm' || settled) return;
  const data = request.data;
  if (
    !(data?.bytes instanceof ArrayBuffer) ||
    !data.bytes.byteLength ||
    data.bytes.byteLength > 32 * 1024 * 1024 ||
    ![COMPRESS_ACTION, PROTECT_ACTION].includes(data.type)
  ) {
    fail();
    return;
  }
  if (
    data.type === PROTECT_ACTION &&
    (typeof data.password !== 'string' || !data.password)
  ) {
    fail();
    return;
  }
  const input = new Uint8Array(data.bytes);
  const settings = { low: '/printer', medium: '/ebook', high: '/screen' };
  const mode =
    data.type === PROTECT_ACTION
      ? [
          `-sOwnerPassword=${data.password}`,
          `-sUserPassword=${data.password}`,
          '-dEncryptionPermissions=-4'
        ]
      : [`-dPDFSETTINGS=${settings[data.compressionLevel] || '/ebook'}`];
  self.Module = {
    preRun: [
      () => {
        try {
          self.Module.FS.writeFile('input.pdf', input);
        } catch {
          fail();
        }
      }
    ],
    postRun: [
      () => {
        if (settled) return;
        try {
          const output = self.Module.FS.readFile('output.pdf', {
            encoding: 'binary'
          });
          if (!output.length || output.length > 64 * 1024 * 1024) {
            fail();
            return;
          }
          const bytes = Uint8Array.from(output).buffer;
          self.postMessage({ ok: true, bytes }, [bytes]);
          settled = true;
        } catch {
          fail();
        }
      }
    ],
    arguments: [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      ...mode,
      '-DNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-sOutputFile=output.pdf',
      'input.pdf'
    ],
    print: () => {},
    printErr: () => {},
    onAbort: fail,
    totalDependencies: 0,
    noExitRuntime: 1
  };
  // Only the codec asset is downloaded remotely. Never log arguments or input.
  const load = async () => {
    const response = await fetch('https://cdn-wasm.b-cdn.net/gs-worker.wasm', {
      credentials: 'same-origin'
    });
    if (
      !response.ok ||
      Number(response.headers.get('content-length')) > 32 * 1024 * 1024
    )
      throw new Error('WASM asset unavailable.');
    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > 32 * 1024 * 1024)
      throw new Error('Invalid WASM asset size.');
    self.Module.wasmBinary = new Uint8Array(bytes);
    await import('./gs-worker.js');
  };
  load().catch(fail);
});

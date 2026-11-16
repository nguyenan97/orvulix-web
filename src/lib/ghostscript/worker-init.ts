export const COMPRESS_ACTION = 'compress-pdf';
export const PROTECT_ACTION = 'protect-pdf';
type Request = {
  bytes: ArrayBuffer;
  compressionLevel?: string;
  password?: string;
};

function run(
  type: string,
  request: Request,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('PDF processing cancelled.'));
      return;
    }
    if (
      !(request.bytes instanceof ArrayBuffer) ||
      !request.bytes.byteLength ||
      request.bytes.byteLength > 32 * 1024 * 1024
    ) {
      reject(new Error('PDF input limit is 32 MiB.'));
      return;
    }
    let worker: Worker;
    try {
      worker = new Worker(new URL('./background-worker.js', import.meta.url), {
        type: 'module'
      });
    } catch {
      reject(
        new Error(
          'Could not start the PDF worker. Check browser worker permissions.'
        )
      );
      return;
    }
    let done = false;
    const finish = (bytes?: ArrayBuffer, error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.removeEventListener('message', message);
      worker.removeEventListener('error', failed);
      worker.removeEventListener('messageerror', invalid);
      worker.terminate();
      if (error) reject(error);
      else resolve(bytes!);
    };
    const abort = () =>
      finish(undefined, new Error('PDF processing cancelled.'));
    const failed = (event: Event) => {
      event.preventDefault();
      finish(
        undefined,
        new Error(
          'The PDF worker failed. Check the WASM download or try again.'
        )
      );
    };
    const invalid = () =>
      finish(undefined, new Error('Invalid PDF worker message.'));
    const message = ({ data }: MessageEvent) => {
      if (data?.ok !== true) {
        finish(
          undefined,
          new Error(
            'PDF processing failed. The Ghostscript WASM asset may be unavailable, or the PDF is unsupported.'
          )
        );
        return;
      }
      const bytes: unknown = data.bytes;
      if (
        !(bytes instanceof ArrayBuffer) ||
        bytes.byteLength < 5 ||
        bytes.byteLength > 64 * 1024 * 1024 ||
        new TextDecoder().decode(new Uint8Array(bytes, 0, 5)) !== '%PDF-'
      ) {
        invalid();
        return;
      }
      finish(bytes);
    };
    const timer = setTimeout(
      () =>
        finish(
          undefined,
          new Error(
            'PDF processing exceeded the 30 second limit. Try a smaller PDF or check the WASM download.'
          )
        ),
      30000
    );
    worker.addEventListener('message', message);
    worker.addEventListener('error', failed);
    worker.addEventListener('messageerror', invalid);
    signal?.addEventListener('abort', abort, { once: true });
    try {
      worker.postMessage({ target: 'wasm', data: { ...request, type } }, [
        request.bytes
      ]);
    } catch {
      finish(undefined, new Error('Could not send the PDF to its worker.'));
    }
  });
}

export const compressWithGhostScript = (
  request: Request,
  signal?: AbortSignal
) => run(COMPRESS_ACTION, request, signal);
export const protectWithGhostScript = (
  request: Request,
  signal?: AbortSignal
) => run(PROTECT_ACTION, request, signal);

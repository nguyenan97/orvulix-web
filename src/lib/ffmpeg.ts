import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const CORE_VERSION = '0.12.6';
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

type FFmpegTaskContext = {
  ffmpeg: FFmpeg;
  tempFile: (extension: string) => string;
};

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance;
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      const ffmpeg = new FFmpeg();

      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${BASE_URL}/ffmpeg-core.js`,
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          `${BASE_URL}/ffmpeg-core.wasm`,
          'application/wasm'
        )
      });

      ffmpegInstance = ffmpeg;

      return ffmpeg;
    })();
  }

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

/**
 * Destroy the current FFmpeg instance.
 *
 * Normally not needed because the instance is reused.
 * Use only after worker crashes or when explicitly freeing memory.
 */
export function resetFFmpeg(): void {
  ffmpegInstance?.terminate();

  ffmpegInstance = null;
  loadingPromise = null;
}

// FFmpeg worker is not safe for concurrent operations.
let taskQueue: Promise<unknown> = Promise.resolve();

export async function runFFmpegTask<T>(
  task: (context: FFmpegTaskContext) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  signal?.throwIfAborted(); // Opt-in cancellation: existing callers retain their contract.
  const ffmpeg = await getFFmpeg();
  signal?.throwIfAborted();

  const run = taskQueue
    .catch(() => {})
    .then(async () => {
      signal?.throwIfAborted(); // Skip obsolete queued callbacks without resetting the shared worker.
      const tempFiles = new Set<string>();

      const tempFile = (extension: string) => {
        const filename = `${crypto.randomUUID()}${extension}`;

        tempFiles.add(filename);

        return filename;
      };

      let result: T;
      try {
        result = await task({
          ffmpeg,
          tempFile
        });
        signal?.throwIfAborted();
      } finally {
        await Promise.all(
          [...tempFiles].map((file) => ffmpeg.deleteFile(file).catch(() => {}))
        );
      }
      signal?.throwIfAborted();
      return result;
    });

  taskQueue = run.catch(() => {});

  return run;
}

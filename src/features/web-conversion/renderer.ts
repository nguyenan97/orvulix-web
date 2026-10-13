import {
  LIMITS,
  type ImageOptions,
  checkAbort,
  abortError,
  safeFilename,
  validateOptions
} from './model';
import { frameDocument, type PreparedHtml } from './sanitize';
import { validateEmbeddedImages } from './assets';
import { inspectLayout, enforceCropPolicy, type LayoutReport } from './layout';

export async function captureHtml(
  prepared: PreparedHtml,
  options: ImageOptions,
  signal: AbortSignal,
  onLayout?: (report: LayoutReport) => void
): Promise<File> {
  validateOptions(options);
  checkAbort(signal);
  if (prepared.assets.length)
    await validateEmbeddedImages(prepared.assets, signal);
  checkAbort(signal);
  const frame = document.createElement('iframe');
  frame.title = 'Temporary image renderer';
  frame.dataset.htmlRenderer = 'true';
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${options.width}px`,
    height: `${options.height}px`,
    border: '0'
  });
  let canvas: HTMLCanvasElement | undefined;
  const deadline = performance.now() + LIMITS.timeoutMs;
  const timeoutError = () =>
    Error('Rendering took too long. Simplify your HTML.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let removeAbort = () => {};
  const checkActive = () => {
    checkAbort(signal);
    if (!frame.isConnected) throw abortError();
    if (performance.now() > deadline) throw timeoutError();
  };
  // The owned frame isolates input styles; the engine serializes only its safe
  // DOM into an SVG/canvas. No application DOM or untrusted scripts are rendered.
  try {
    const ready = new Promise<void>((resolve, reject) => {
      frame.onload = () => resolve();
      frame.onerror = () =>
        reject(Error('Could not prepare the HTML renderer.'));
    });
    const cancelled = new Promise<never>((_, reject) => {
      const abort = () => {
        frame.remove();
        reject(abortError());
      };
      signal.addEventListener('abort', abort, { once: true });
      removeAbort = () => signal.removeEventListener('abort', abort);
      timer = setTimeout(() => {
        frame.remove();
        reject(timeoutError());
      }, LIMITS.timeoutMs);
    });
    frame.srcdoc = frameDocument(prepared);
    document.body.append(frame);
    const render = async () => {
      await ready;
      checkActive();
      const body = frame.contentDocument?.body;
      if (!body)
        throw Error('The browser blocked access to the HTML renderer.');
      const report = inspectLayout(body, options);
      onLayout?.(report);
      enforceCropPolicy(report, options.cropPolicy);
      checkActive();
      const { toCanvas } = await import('html-to-image');
      checkActive();
      const captured = await toCanvas(body, {
        width: options.width,
        height: options.height,
        canvasWidth: options.width,
        canvasHeight: options.height,
        pixelRatio: options.scale,
        skipAutoScale: true,
        skipFonts: true,
        backgroundColor:
          options.format === 'jpeg' || options.background === 'white'
            ? '#ffffff'
            : undefined
      });
      if (signal.aborted || !frame.isConnected) {
        captured.width = captured.height = 0;
        throw abortError();
      }
      canvas = captured;
      checkActive();
      const blob = await new Promise<Blob>((resolve, reject) =>
        captured.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(Error('The browser could not encode the image.')),
          `image/${options.format}`,
          options.quality
        )
      );
      checkActive();
      if (blob.size > LIMITS.outputBytes)
        throw Error('Image exceeds the 8 MiB output limit.');
      if (blob.type !== `image/${options.format}`)
        throw Error('The requested image format is unavailable.');
      const file = new File(
        [blob],
        safeFilename(options.filename, options.format),
        {
          type: blob.type
        }
      );
      checkActive();
      return file;
    };
    return await Promise.race([render(), cancelled]);
  } finally {
    clearTimeout(timer);
    removeAbort();
    frame.onload = frame.onerror = null;
    frame.remove();
    if (canvas) canvas.width = canvas.height = 0;
  }
}

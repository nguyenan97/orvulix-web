import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';
import JSZip from 'jszip';
import {
  withPdfDocument,
  checkPdfActive,
  PdfConversionError
} from '../../../../features/pdf-conversion/document';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function encode(canvas: HTMLCanvasElement, signal: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    try {
      canvas.toBlob((blob) => {
        signal.removeEventListener('abort', abort);
        if (signal.aborted) reject(signal.reason);
        else if (blob) resolve(blob);
        else
          reject(
            new PdfConversionError('Canvas could not encode this PDF page.')
          );
      }, 'image/png');
    } catch {
      signal.removeEventListener('abort', abort);
      reject(new PdfConversionError('Canvas could not encode this PDF page.'));
    }
  });
}

export async function convertPdfToPngImages(
  pdfFile: File,
  signal?: AbortSignal
) {
  return withPdfDocument(pdfFile, signal, async (pdf, active) => {
    const zip = new JSZip();
    const images: { blob: Blob; filename: string }[] = [];
    let totalPixels = 0;
    let totalBytes = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      checkPdfActive(active);
      const page = await pdf.getPage(i);
      let canvas: HTMLCanvasElement | undefined;
      try {
        const viewport = page.getViewport({ scale: 2 });
        const width = Math.ceil(viewport.width),
          height = Math.ceil(viewport.height);
        const pixels = width * height;
        if (
          ![width, height].every(
            (value) => Number.isFinite(value) && value > 0 && value <= 4096
          ) ||
          pixels > 8 * 1024 * 1024 ||
          totalPixels + pixels > 32 * 1024 * 1024
        )
          throw new PdfConversionError(
            'PDF pixel limit: 4096 per side, 8 Mi pixels per page, 32 Mi pixels total.'
          );
        totalPixels += pixels;
        checkPdfActive(active);
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context)
          throw new PdfConversionError(
            'Canvas rendering is unavailable in this browser.'
          );
        const render = page.render({
          canvas,
          canvasContext: context,
          viewport
        });
        const cancelRender = () => render.cancel();
        active.addEventListener('abort', cancelRender, { once: true });
        try {
          await render.promise;
        } finally {
          active.removeEventListener('abort', cancelRender);
        }
        checkPdfActive(active);
        const blob = await encode(canvas, active);
        checkPdfActive(active);
        totalBytes += blob.size;
        if (totalBytes > 64 * 1024 * 1024)
          throw new PdfConversionError(
            'PNG output limit is 64 MiB. Try fewer pages.'
          );
        const filename = `page-${i}.png`;
        images.push({ blob, filename });
        zip.file(filename, blob);
      } finally {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        page.cleanup();
      }
    }
    const bytes = await zip.generateAsync({ type: 'arraybuffer' });
    checkPdfActive(active);
    if (bytes.byteLength > 64 * 1024 * 1024)
      throw new PdfConversionError(
        'ZIP output limit is 64 MiB. Try fewer pages.'
      );
    return {
      images,
      zipFile: new File(
        [bytes],
        pdfFile.name.replace(/\.pdf$/i, '-pages.zip'),
        { type: 'application/zip' }
      )
    };
  });
}

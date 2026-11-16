import type { InitialValuesType } from './types';
import { compressWithGhostScript } from '../../../../lib/ghostscript/worker-init';

export async function compressPdf(
  pdfFile: File,
  options: InitialValuesType,
  signal?: AbortSignal
): Promise<File> {
  if (pdfFile.type !== 'application/pdf')
    throw new Error('The provided file is not a PDF');
  if (!pdfFile.size || pdfFile.size > 32 * 1024 * 1024)
    throw new Error('PDF input limit is 32 MiB.');
  const bytes = await compressWithGhostScript(
    {
      bytes: await pdfFile.arrayBuffer(),
      compressionLevel: options.compressionLevel
    },
    signal
  );
  return new File([bytes], pdfFile.name, { type: 'application/pdf' });
}

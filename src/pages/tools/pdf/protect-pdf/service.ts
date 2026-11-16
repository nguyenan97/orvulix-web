import type { InitialValuesType } from './types';
import { protectWithGhostScript } from '../../../../lib/ghostscript/worker-init';

export async function protectPdf(
  pdfFile: File,
  options: InitialValuesType,
  signal?: AbortSignal
): Promise<File> {
  if (pdfFile.type !== 'application/pdf')
    throw new Error('The provided file is not a PDF');
  if (!pdfFile.size || pdfFile.size > 32 * 1024 * 1024)
    throw new Error('PDF input limit is 32 MiB.');
  if (options.password !== options.confirmPassword)
    throw new Error('Passwords do not match');
  if (!options.password) throw new Error('Password cannot be empty');
  const bytes = await protectWithGhostScript(
    { bytes: await pdfFile.arrayBuffer(), password: options.password },
    signal
  );
  return new File([bytes], pdfFile.name.replace(/\.pdf$/i, '-protected.pdf'), {
    type: 'application/pdf'
  });
}

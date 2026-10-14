export type FileKind = 'image' | 'audio' | 'video' | 'pdf';
export interface InputFile {
  file: File;
  order: number;
  preview?: string;
}
const MiB = 1024 * 1024;
export const LIMITS = {
  image: { count: 20, file: 16 * MiB, total: 64 * MiB },
  pdf: { count: 20, file: 32 * MiB, total: 128 * MiB },
  audio: { count: 10, file: 64 * MiB, total: 128 * MiB },
  video: { count: 10, file: 64 * MiB, total: 128 * MiB }
} as const;
const mimeExtensions: Record<string, readonly string[]> = {
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'image/heic': ['heic'],
  'image/heif': ['heif'],
  'image/svg+xml': ['svg'],
  'image/bmp': ['bmp'],
  'image/avif': ['avif'],
  'application/pdf': ['pdf'],
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
  'audio/aac': ['aac'],
  'audio/ogg': ['ogg'],
  'audio/flac': ['flac'],
  'audio/mp4': ['m4a'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov'],
  'video/x-msvideo': ['avi'],
  'video/ogg': ['ogv']
};
/** Selection hint, not content validation. Empty MIME uses known extensions only. */
export function isAcceptedFile(file: File, accept: readonly string[]) {
  const extension =
    file.name.split('.').length > 1
      ? file.name.split('.').pop()!.toLowerCase()
      : '';
  const mime = file.type.toLowerCase();
  return accept.some((raw) => {
    const rule = raw.toLowerCase();
    if (rule.startsWith('.')) return extension === rule.slice(1);
    if (rule.endsWith('/*')) {
      const prefix = rule.slice(0, -1);
      return mime
        ? mime.startsWith(prefix)
        : Object.entries(mimeExtensions).some(
            ([type, extensions]) =>
              type.startsWith(prefix) && extensions.includes(extension)
          );
    }
    return mime ? mime === rule : !!mimeExtensions[rule]?.includes(extension);
  });
}
export function validateBatch(
  files: readonly File[],
  current: readonly File[],
  kind: FileKind,
  accept: readonly string[]
) {
  const limit = LIMITS[kind];
  if (!files.length) throw Error('Choose files, not URLs or directories.');
  if (current.length + files.length > limit.count)
    throw Error(`Maximum ${limit.count} files, including pending imports.`);
  for (const file of files) {
    if (accept.length && !isAcceptedFile(file, accept))
      throw Error(
        `${file.name}: unsupported file type. No files from this batch were added.`
      );
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > limit.file)
      throw Error(
        `${file.name}: file must be non-empty and at most ${
          limit.file / MiB
        } MiB.`
      );
  }
  if (
    [...current, ...files].reduce((sum, file) => sum + file.size, 0) >
    limit.total
  )
    throw Error(
      `Maximum ${limit.total / MiB} MiB combined, including pending imports.`
    );
}

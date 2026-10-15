import { runFFmpegTask } from 'lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { InitialValuesType } from './types';
import { getFileExtension } from '@utils/file';
import {
  normalizeMixedGif,
  GifInputError,
  MIXED_GIF_LIMITS
} from '../../../../../features/gif-conversion/mixed-input'; // ORVULIX: uniform codec for mixed PNG/JPEG.

export async function imagesToGif(
  input: File[],
  optionsValues: InitialValuesType,
  signal?: AbortSignal
): Promise<File> {
  return runFFmpegTask(async ({ ffmpeg, tempFile }) => {
    signal?.throwIfAborted();
    const { frameRateMode, frameRateValue } = optionsValues;

    const fileNames: string[] = [];
    const listName = tempFile('.txt');
    const outputName = tempFile('.gif');

    const durationSeconds =
      frameRateMode === 'fps' ? 1 / frameRateValue : frameRateValue / 1000;

    const normalized = await normalizeMixedGif(
      input,
      { ffmpeg, tempFile },
      signal
    );
    if (normalized) fileNames.push(...normalized);
    else
      for (let i = 0; i < input.length; i++) {
        const file = input[i];
        const ext = getFileExtension(file.name) ?? 'jpg';

        const inputName = tempFile(`.${ext}`);

        fileNames.push(inputName);

        signal?.throwIfAborted();
        const bytes = await fetchFile(file);
        signal?.throwIfAborted();
        await ffmpeg.writeFile(inputName, bytes);
        signal?.throwIfAborted();
      }

    const listContent =
      fileNames
        .map((name) => `file '${name}'\nduration ${durationSeconds}`)
        .join('\n') + `\nfile '${fileNames[fileNames.length - 1]}'`;

    signal?.throwIfAborted();
    await ffmpeg.writeFile(listName, listContent);
    signal?.throwIfAborted();

    const exitCode = await ffmpeg.exec([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listName,
      '-vf',
      'scale=iw:-2:flags=lanczos',
      '-loop',
      '0',
      outputName
    ]);

    signal?.throwIfAborted();
    if (normalized && exitCode !== 0)
      throw new GifInputError(
        'Mixed GIF encoding failed. Use fewer or smaller static PNG/JPEG images.'
      );
    const data = await ffmpeg.readFile(outputName);
    signal?.throwIfAborted();

    if (
      normalized &&
      (typeof data === 'string' || data.byteLength > MIXED_GIF_LIMITS.output)
    )
      throw new GifInputError(
        'GIF exceeds 32 MiB. Use fewer or smaller images.'
      );
    return new File([new Uint8Array(data as Uint8Array)], 'animated.gif', {
      type: 'image/gif'
    });
  }, signal);
}

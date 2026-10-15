import { runFFmpegTask } from 'lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { InitialValuesType } from './types';
import { getFileExtension } from '@utils/file';

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

    await ffmpeg.exec([
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
    const data = await ffmpeg.readFile(outputName);
    signal?.throwIfAborted();

    return new File([new Uint8Array(data as Uint8Array)], 'animated.gif', {
      type: 'image/gif'
    });
  }, signal);
}

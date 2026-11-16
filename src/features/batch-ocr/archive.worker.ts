import JSZip from 'jszip';
import { entryName, MAX_TEXT, MAX_TOTAL_TEXT } from './policy';
self.onmessage = async ({
  data
}: MessageEvent<{ names: string[]; texts: string[] }>) => {
  try {
    if (
      data.names.length !== data.texts.length ||
      data.texts.length > 10 ||
      data.texts.some(
        (text) => typeof text !== 'string' || text.length > MAX_TEXT
      ) ||
      data.texts.reduce((n, text) => n + text.length, 0) > MAX_TOTAL_TEXT
    )
      throw Error();
    const zip = new JSZip();
    data.texts.forEach((text, index) =>
      zip.file(entryName(data.names[index], index), text)
    );
    const bytes = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'STORE'
    });
    self.postMessage({ bytes }, { transfer: [bytes] });
  } catch {
    self.postMessage({ error: 'Could not create the text ZIP.' });
  }
};

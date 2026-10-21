import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'Batch OCR - English and Vietnamese Text | Orvulix',
  description:
    'Recognize text locally from up to 10 PNG/JPEG images. Choose English or Vietnamese before running, cancel processing and download ordered TXT/ZIP results.',
  howTo: [
    'Choose static PNG/JPEG images and review their displayed selection order.',
    'Select English, Vietnamese or both. No language detection is performed.',
    'Choose Run OCR to download models and process images sequentially. Cancel discards partial results.',
    'Proofread the text, then download the combined TXT or numbered TXT entries in a ZIP.'
  ],
  notes: [
    'Image contents and recognized text are not uploaded. Running OCR downloads public models from jsDelivr, exposing your IP address to that service. Browser asset caching may occur; application model persistence is disabled.',
    'Limits: 10 files, 4 MiB each, 24 MiB combined, 4096 pixels per side and 4 million pixels per image. The 180-second deadline terminates processing. PNGs allow 512 chunks and their ancillary metadata except transparency is removed from the OCR working copy before decoding. Original files are unchanged. These are admission limits, not a hard browser heap quota.',
    'Output is plain text with up to 100,000 characters per image and 500,000 per batch. Accuracy varies. Empty recognition produces an empty ordered entry with a warning.',
    'Changing inputs or language, Cancel, Clear and leaving the tool discard current output. PDF output, layout preservation and automatic language detection are deferred.'
  ]
};
export default content;

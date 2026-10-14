import { DEFAULT_OPTIONS, validateOptions, type ImageOptions } from './model';
import { DEFAULT_PDF_OPTIONS, pdfGeometry, type PdfOptions } from './pdf-model';

interface PresetBase {
  id: string;
  label: string;
  image: Omit<ImageOptions, 'filename'>;
}
export type ConversionPreset =
  | (PresetBase & { output: 'image' })
  | (PresetBase & {
      output: 'pdf';
      layout: 'one' | 'paginated';
      pdf: PdfOptions;
    });
const { filename: _filename, ...imageDefaults } = DEFAULT_OPTIONS;
export const CONVERSION_PRESETS: readonly ConversionPreset[] = [
  {
    id: 'square-png',
    label: 'Square PNG - 640 x 640',
    output: 'image',
    image: { ...imageDefaults, width: 640, height: 640 }
  },
  {
    id: 'wide-jpeg',
    label: 'Wide JPEG - 960 x 540',
    output: 'image',
    image: { ...imageDefaults, width: 960, height: 540, format: 'jpeg' }
  },
  {
    id: 'portrait-png',
    label: 'Portrait PNG - 720 x 960',
    output: 'image',
    image: { ...imageDefaults, width: 720, height: 960 }
  },
  {
    id: 'a4-one',
    label: 'A4 portrait - One page',
    output: 'pdf',
    image: { ...imageDefaults },
    layout: 'one',
    pdf: { ...DEFAULT_PDF_OPTIONS, margins: { ...DEFAULT_PDF_OPTIONS.margins } }
  },
  {
    id: 'a4-pages',
    label: 'A4 portrait - Paginated',
    output: 'pdf',
    image: { ...imageDefaults },
    layout: 'paginated',
    pdf: { ...DEFAULT_PDF_OPTIONS, margins: { ...DEFAULT_PDF_OPTIONS.margins } }
  },
  {
    id: 'letter-pages',
    label: 'Letter landscape - Paginated',
    output: 'pdf',
    image: { ...imageDefaults, width: 640 },
    layout: 'paginated',
    pdf: {
      paper: 'letter',
      orientation: 'landscape',
      margins: { ...DEFAULT_PDF_OPTIONS.margins }
    }
  }
];
export type PresetSnapshot =
  | { output: 'image'; image: ImageOptions }
  | {
      output: 'pdf';
      image: ImageOptions;
      layout: 'one' | 'paginated';
      pdf: PdfOptions;
    };
/** Built-in option templates only. Input/assets/output never enter this contract. */
export function resolvePreset(
  id: string,
  output: 'image' | 'pdf',
  filename: string
): PresetSnapshot {
  const preset = CONVERSION_PRESETS.find(
    (p) => p.id === id && p.output === output
  );
  if (!preset) throw Error('Choose a supported conversion preset.');
  const image = { ...preset.image, filename };
  validateOptions(
    preset.output === 'pdf' && preset.layout === 'paginated'
      ? { ...image, height: 100 }
      : image
  );
  if (preset.output === 'image') return { output: 'image', image };
  const pdf = { ...preset.pdf, margins: { ...preset.pdf.margins } };
  if (!['one', 'paginated'].includes(preset.layout))
    throw Error('Unsupported preset layout.');
  pdfGeometry(
    pdf,
    preset.layout === 'paginated' ? { ...image, height: 100 } : image
  );
  return { output: 'pdf', image, layout: preset.layout, pdf };
}

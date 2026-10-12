import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'HTML to Image - Local PNG and JPEG Export | Orvulix',
  description:
    'Convert static HTML text, tables and lists to PNG or JPEG locally. Preview safe inline styles, choose dimensions and transparency, then download.',
  howTo: [
    'Paste static HTML or upload an .html/.htm file, or load the invoice example.',
    'Choose image dimensions, scale, format and background. Preview checks the supported markup.',
    'Click Convert to image. Review the result and download the PNG or JPEG.',
    'Editing HTML or options clears the previous result. Convert again to export the changes.'
  ],
  notes: [
    'This tool processes the supported static HTML in your browser without uploading it. The app still loads its own assets and localization files.',
    'Scripts, images, stylesheet blocks, external resources and unsupported inline CSS are removed. This MVP supports text, lists and tables, not arbitrary website screenshots.',
    'Output is cropped to the selected dimensions. JPEG always has a white background; PNG supports transparency.',
    'HTML is limited to 64 KiB with 1000 processed nodes and 24 levels. Output is limited to 2 megapixels and 8 MiB.',
    'Cancellation discards the job and removes its frame. DOM rendering has no hard CPU or memory quota.'
  ],
  faq: [
    {
      question: 'Can I convert a website URL?',
      answer:
        'No. This tool takes static HTML text or a local HTML file. URL conversion needs a separate renderer and is planned.'
    },
    {
      question: 'Can I export HTML to PDF here?',
      answer:
        'No. This tool exports PNG and JPEG only. HTML to PDF is a separate planned feature.'
    }
  ]
};
export default content;

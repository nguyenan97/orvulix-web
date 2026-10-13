import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'HTML to Image - Local PNG and JPEG Export | Orvulix',
  description:
    'Convert static HTML with embedded PNG/JPEG images to PNG or JPEG locally. Preview safe styles, set dimensions and transparency, then download.',
  howTo: [
    'Paste static HTML or upload an .html/.htm file, or load the invoice example.',
    'Embed static PNG/JPEG images as base64 data URLs; external sources and SVG are removed.',
    'Choose image dimensions, scale, format and background. Preview checks the supported markup.',
    'Click Convert to image. Review the result and download the PNG or JPEG.',
    'Editing HTML or options clears the previous result. Convert again to export the changes.'
  ],
  notes: [
    'This tool processes the supported static HTML in your browser without uploading it. The app still loads its own assets and localization files.',
    'Scripts, external images, SVG, stylesheet blocks, external resources and unsupported inline CSS are removed. Supported embedded assets are plain static PNG or baseline/progressive JPEG.',
    'Embed up to 4 raster images: 48 KiB combined encoded-file bytes, 1024 pixels per side, 500000 pixels per image and 1 megapixel combined. PNG animation, compressed metadata and 16-bit PNG are not supported.',
    'Output is cropped to the selected dimensions. JPEG always has a white background; PNG supports transparency.',
    'Preview and export warn when content overflows or a table row crosses the bottom edge. Choose Stop if content is cropped to reject incomplete output. This tool exports one image; it does not paginate.',
    'Safe system font stacks use Arial, system-ui, serif, sans-serif or monospace. Custom/embedded fonts, stylesheet imports and page-break CSS are not supported.',
    'HTML is limited to 64 KiB with 1000 processed nodes and 24 levels. Output is limited to 2 megapixels and 8 MiB.',
    'Image headers are checked before native decode and preview. Cancellation closes late bitmaps and removes frames, but native decode and DOM rendering have no hard CPU or memory quota.'
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
        'This tool exports PNG and JPEG only. Use the separate HTML to PDF tool for local raster PDF output; its text is not searchable or selectable.'
    }
  ]
};
export default content;

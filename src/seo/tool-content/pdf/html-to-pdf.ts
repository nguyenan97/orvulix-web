import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'HTML to PDF - Local One-Page Raster Export | Orvulix',
  description:
    'Convert static HTML with embedded images to a one-page PDF locally. Preview A4 or Letter, set orientation and margins, then download a raster PDF.',
  howTo: [
    'Paste or upload static HTML, or load the Vietnamese invoice example.',
    'Choose viewport dimensions, raster scale, A4 or Letter, orientation and margins.',
    'Preview the page fit. Resolve crop warnings or select strict overflow handling.',
    'Click Convert to PDF and download the one-page raster document.'
  ],
  notes: [
    'PDF text is rasterized and is not searchable or selectable. This tool does not paginate, repeat headers or support page ranges.',
    'The fixed HTML viewport is fitted and centered in the printable area with its aspect ratio preserved. Scale changes raster resolution, not placement. Margins must leave positive printable space.',
    'Only safe static HTML, system font stacks and bounded embedded PNG/JPEG images are supported. Scripts, external resources, SVG, stylesheet imports, custom fonts and page-break CSS are blocked or removed with warnings.',
    'Input is limited to 64 KiB, 1000 nodes and 24 levels. Raster capture is limited to 2 megapixels and 8 MiB; PDF output is limited to 8 MiB and one page.',
    'PNG transparency is preserved; PDF paper is white. Cancellation discards old results and owned resources; native decode, DOM rendering and synchronous PDF encoding have no hard CPU or memory quota.'
  ],
  faq: [
    {
      question: 'Can I search or select text in this PDF?',
      answer:
        'No. Each PDF page contains a raster image of the supported HTML. Use another workflow if searchable text is required.'
    },
    {
      question: 'Can I convert a website URL or create multiple pages?',
      answer:
        'No. This tool accepts local static HTML and exports one page only. It does not load remote pages or paginate content.'
    }
  ]
};
export default content;

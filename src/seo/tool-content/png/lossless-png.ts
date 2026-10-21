import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'Lossless PNG Optimizer - Preserve Pixels | Orvulix',
  description:
    'Recompress a local static PNG while preserving pixel samples and accepted metadata. Keep the original when it is smaller. No upload; files up to 4 MiB.',
  howTo: [
    'Choose a local static PNG up to 4 MiB. No preview is loaded before validation.',
    'Choose Optimize PNG. Cancel or Clear file to terminate processing and discard its result.',
    'Review the byte sizes. An equal or larger result keeps the original file.',
    'Download the current PNG; changing the file removes old downloads.'
  ],
  notes: [
    'Native streams recompress existing IDAT data without changing filters, color samples or accepted non-IDAT chunks. The result may not be smaller; filters and color types are retained. No palette reduction is applied.',
    'Supports legal PNG color/depth combinations and Adam7 within 4096 pixels per side, 4 million pixels, 512 chunks and 32 MiB filtered data. The worker stops after 15 seconds. Byte limits are not a strict total heap quota.',
    'Animated PNG and unsupported unsafe-to-copy chunks are rejected. Common metadata is retained as opaque bytes, not decoded or fully validated as ICC/EXIF content.',
    'File contents stay in a disposable browser worker without upload or automatic saving. Requires native compression streams; no lossy fallback is used.'
  ]
};
export default content;

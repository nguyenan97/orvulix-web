import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'File Checksum Calculator - SHA-256 and SHA-512 | Orvulix',
  description:
    'Calculate SHA-256 or SHA-512 for a local file up to 64 MiB, compare an expected hexadecimal checksum and copy the result in your browser.',
  howTo: [
    'Choose one local file up to 64 MiB and select SHA-256 or SHA-512.',
    'Choose Calculate checksum. Cancel calculation or Clear file to discard the run.',
    'Paste an optional expected hexadecimal checksum to compare. Letter case and surrounding whitespace are ignored.',
    'Copy the checksum, or select it manually if clipboard access is unavailable.'
  ],
  notes: [
    'File bytes are hashed in a browser worker with Web Crypto, without upload or automatic saving. HTTPS or localhost is required.',
    'The 64 MiB file limit is checked before reading. Web Crypto reads the whole file into memory; this is not a strict total heap quota. A 30-second deadline terminates application processing.',
    'Changing the file or algorithm clears old output. Empty files are supported. No MD5, encryption or batch processing is provided.',
    'A match establishes equality with the supplied checksum, not the authenticity of its source.'
  ]
};
export default content;

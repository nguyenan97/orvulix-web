import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'Text Workflow Builder - Chain Text Tools | Orvulix',
  description:
    'Combine text transformations into ordered steps. Preview intermediate outputs and import or export settings-only recipes in your browser.',
  howTo: [
    'Enter text, then add transformations and edit their options.',
    'Use Move up, Move down or Remove to change the workflow. The buttons work with a keyboard.',
    'Choose Run workflow to inspect each intermediate output and the final result.',
    'Copy or download a successful final result. Editing text or steps clears previous results.',
    'Export a settings-only JSON recipe, or import a version-1 recipe to reuse a workflow.'
  ],
  examples: [
    {
      title: 'Build a workflow',
      description:
        'Trim "  hello world  ", uppercase, reverse and Base64 encode to produce "RExST1cgT0xMRUg=".'
    }
  ],
  notes: [
    'Six transformations: trim, uppercase, grapheme reverse, duplicate-line removal, UTF-8 Base64 and URL component encode/decode.',
    'Processing runs in a cancellable browser worker with a five-second deadline. Input and output are not saved automatically or included in recipe downloads.',
    'Input is limited to 65,536 UTF-16 units and 16 steps. Each output is limited to 262,144 units; retained intermediate outputs total at most 1,048,576 units. These admission limits are not a hard heap quota.',
    'Recipes are limited to 32,768 file bytes and 32,768 text units, with a versioned whitelist of operations and options. Invalid imports leave existing steps unchanged.',
    'Base64 decoding requires the standard alphabet, canonical padding and valid UTF-8; ASCII whitespace is allowed. Reverse requires Intl.Segmenter and preserves grapheme clusters.',
    'Blank lines follow the selected duplicate-line policy. Sorting uses UTF-16 ordering; literal backslash escapes are not interpreted.'
  ]
};
export default content;

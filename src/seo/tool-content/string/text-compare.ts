/**
 * SEO content for /string/text-compare. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/string/text-compare/service.ts
 * - src/pages/tools/string/text-compare/service.ts; src/utils/string.ts escapeMarkup
 * - node_modules/diff/libesm/diff/word.js WordsWithSpaceDiff.tokenize
 * - Ran node against node_modules/diff/libesm/index.js
 * - src/components/result/ToolDiffResult.tsx '& .diff-added' / '& .diff-removed'; grep of src/config/muiConfig.ts (no success/error)
 * - src/components/result/ToolDiffResult.tsx DOMPURIFY_CONFIG
 * - src/components/result/ToolDiffResult.tsx handleCopy/handleDownload; src/utils/string.ts stripAndDecodeHtml
 * - src/pages/tools/string/text-compare/index.tsx useEffect on [inputA, inputB, level]
 * - src/pages/tools/string/text-compare/index.tsx; public/locales/en/string.json textCompare.*; src/components/input/InputFooter.tsx; public/locales/en/translation.json
 * - grep for fetch/XMLHttpRequest/sendBeacon/WebSocket in node_modules/diff/libesm and node_modules/dompurify/dist/purify.es.mjs (no matches)
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Compare Two Texts and Highlight Differences | Orvulix',
  description:
    'Paste two versions of a text to see added text in green and removed text in red. Switch to character level to spot single-letter changes.',
  howTo: [
    'Paste the original text into the first Input Text box.',
    'Paste the changed version into the second Input Text box. You can also load either box from a file with Select files.',
    'Under Comparison Settings, choose Word level or Character level.',
    'Check the Highlighted differences panel, which updates as you type. Text that is only in the second box is shaded green, and text that is only in the first box is shaded red.',
    'Click Copy to clipboard to copy the result as plain text, or Download to save it as diff-output.html.'
  ],
  examples: [
    {
      title: 'Changed word (Word level)',
      description:
        '"I am in Lyon" vs "I am in Marseille" -> "Lyon" is marked as removed and "Marseille" as added. "I am in " stays unmarked.'
    },
    {
      title: 'Spelling change (Character level)',
      description:
        '"color" vs "colour" -> only the letter "u" is marked as added.'
    },
    {
      title: 'Appended text (Word level)',
      description:
        '"Hello world" vs "Hello world here" -> " here" is marked as added.'
    }
  ],
  notes: [
    'Word level treats words, runs of spaces, line breaks and individual punctuation marks as separate units. Changes in spacing and punctuation are highlighted too.',
    'The comparison is case-sensitive at both levels, so "Hello" and "hello" count as different.',
    'Differences appear inline in a single panel rather than side by side. Removed and added parts are shown next to each other.',
    'Comparison runs in your browser using the diff (jsdiff) library, and the output is cleaned with DOMPurify. Neither the tool code nor these libraries sends your text over the network.'
  ],
  faq: [
    {
      question: 'Which box is treated as the original text?',
      answer:
        'The first box. Text found only in the first box is marked as removed (red). Text found only in the second box is marked as added (green).'
    },
    {
      question: 'Can it ignore case or extra spaces?',
      answer:
        'No. There is no option to ignore them. Both levels compare text exactly, so a change in capitalization, spacing or line breaks is shown as a difference.'
    },
    {
      question: 'What do Copy and Download give me?',
      answer:
        'Download saves diff-output.html. In that file, changes are wrapped in span elements with the classes diff-added and diff-removed. It has no styles, so the highlights are not colored until you add CSS. Copy to clipboard copies plain text with the removed and added parts run together and the line breaks dropped.'
    }
  ]
};

export default content;

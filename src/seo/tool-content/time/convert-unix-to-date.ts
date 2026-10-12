/**
 * SEO content for /time/convert-unix-to-date. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/time/convert-unix-to-date/service.ts lines 6-15; src/utils/string.ts lines 69-71
 * - src/pages/tools/time/convert-unix-to-date/service.ts lines 13-28
 * - src/pages/tools/time/convert-unix-to-date/service.ts lines 74-88
 * - src/pages/tools/time/convert-unix-to-date/service.ts lines 32-64; src/utils/time.ts lines 68-78
 * - src/pages/tools/time/convert-unix-to-date/service.ts lines 39-47
 * - src/pages/tools/time/convert-unix-to-date/index.tsx lines 15-19 and 91-139; public/locales/en/time.json lines 80-97
 * - node run of the same Date calls used in service.ts lines 15, 27, 37, 53-59
 * - src/pages/tools/time/convert-unix-to-date/index.tsx lines 144-145; src/components/input/ToolTextInput.tsx lines 31-43, 67; src/components/result/ToolTextResult.tsx lines 14, 26-50; src/components/ToolContent.tsx lines 26-33
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Unix Timestamp to Date Converter and Back | Orvulix',
  description:
    'Convert Unix timestamps in seconds to readable dates in UTC or local time, or turn dates into Unix timestamps. Works line by line and accepts UTC offsets.',
  howTo: [
    'Under Conversion Mode, choose Unix → Date or Date → Unix.',
    "Under Timezone Options, choose Use Local Time or Use UTC (the default). In Unix → Date with UTC, Add 'UTC' suffix is checked by default and adds UTC after each date. Uncheck it to leave the suffix out.",
    'Enter one Unix timestamp in seconds, or one date such as 2025-04-04 10:00:00 +08:00, per line. You can also click Select files to load a text file.',
    'The result updates as you type. Click Copy to clipboard, or click Download to save it as a .txt file.'
  ],
  examples: [
    {
      title: 'Timestamp to UTC date',
      description:
        "1721287227 with Unix → Date, Use UTC and Add 'UTC' suffix gives 2024-07-18 07:20:27.000 UTC."
    },
    {
      title: 'Date with an offset to timestamp',
      description:
        '2025-04-04 10:00:00 +08:00 with Date → Unix gives 1743732000, which is 02:00 UTC on that day.'
    },
    {
      title: 'Date without a time',
      description:
        '2012-12-21 with Date → Unix and Use UTC gives 1356048000, midnight UTC on that date.'
    }
  ],
  notes: [
    "Unix → Date reads timestamps in seconds. A value longer than 10 characters, such as a 13-digit millisecond timestamp, returns 'ms not supported, divide by 1000'.",
    'UTC results use the format YYYY-MM-DD HH:MM:SS.000 and always include milliseconds. Local-time results use YYYY-MM-DD HH:MM:SS.',
    'Lines that cannot be converted, such as text or negative timestamps, give an empty output line, so the results stay aligned with the input lines.',
    'Date → Unix uses an offset at the end of the line, such as +08:00, -05:30 or Z (hours 00-14, minutes 00, 15, 30 or 45). Without an offset, the date is read as UTC. A date with no time is read as midnight.',
    "In Date → Unix, Use Local Time applies your browser's current UTC offset and ignores any offset typed in the input."
  ],
  faq: [
    {
      question: 'How do I convert a timestamp in milliseconds?',
      answer:
        "Divide it by 1000 first, for example by removing the last three digits. This converter accepts seconds only, and inputs longer than 10 characters return 'ms not supported, divide by 1000'."
    },
    {
      question:
        'Which time zone is used when converting a date to a Unix timestamp?',
      answer:
        "If the line ends with an offset such as +08:00 or Z, that offset is used. Otherwise UTC is used. With Use Local Time selected, the browser's offset at the moment you convert is applied instead, so a date on the other side of a daylight saving change can be off by the DST difference."
    },
    {
      question: 'Can I convert many values at once?',
      answer:
        'Yes. Put one timestamp or date on each line. Each line is converted separately, and lines that cannot be converted are left blank in the output.'
    }
  ]
};

export default content;

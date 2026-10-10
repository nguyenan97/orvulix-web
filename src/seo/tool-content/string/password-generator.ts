/**
 * SEO content for /string/password-generator. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/string/password-generator/service.ts randomChar and shuffle
 * - src/pages/tools/string/password-generator/service.ts generatePassword ('Guarantee each selected category appears once')
 * - src/pages/tools/string/password-generator/service.ts generatePassword (Number.parseInt, pools.length === 0)
 * - src/pages/tools/string/password-generator/service.ts SYMBOLS; counted with python
 * - src/pages/tools/string/password-generator/service.ts AMBIGUOUS
 * - src/pages/tools/string/password-generator/index.tsx onOwnChange; src/components/options/TextFieldWithDesc.tsx (onChange passes event.target.value)
 * - src/pages/tools/string/password-generator/initialValues.ts
 * - public/locales/en/string.json passwordGenerator.*; src/pages/tools/string/password-generator/index.tsx
 * - src/components/ToolContent.tsx FormikListenerComponent useEffect on [values, input]; src/pages/tools/string/password-generator/index.tsx
 * - src/components/result/ToolTextResult.tsx; src/components/result/ResultFooter.tsx; public/locales/en/translation.json resultFooter
 * - src/pages/tools/string/password-generator/index.tsx exampleCards
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Random Password Generator, 4 to 256 Characters | Orvulix',
  description:
    'Create random passwords of 4 to 256 characters from lowercase, uppercase, digits and symbols, with an option to leave out i, I, l, 0 and O.',
  howTo: [
    'Under Password Options, enter the password length (4 to 256). The default is 12.',
    'Tick the character types you want: lowercase letters (a-z), uppercase letters (A-Z), numbers (0-9) and special characters.',
    'If you want to leave out characters that are easy to confuse, tick Avoid ambiguous characters (i, I, l, 0, O).',
    'A new password appears in the Generated Password box each time you change an option.',
    'Click Copy to clipboard to copy the password, or Download to save it as a .txt file.'
  ],
  examples: [
    {
      title: 'Default settings',
      description:
        'Length 12 with all four character types ticked -> a 12-character password with at least one lowercase letter, uppercase letter, digit and symbol, such as A7#mK9$pL2@x.'
    },
    {
      title: 'Numeric code',
      description:
        'Length 6 with only Include numbers (0-9) ticked -> a 6-digit code such as 482915.'
    },
    {
      title: 'Easier-to-read password',
      description:
        'Length 16 with Avoid ambiguous characters ticked -> a password that never contains i, I, l, 0 or O.'
    }
  ],
  notes: [
    "Characters are chosen with the browser's crypto.getRandomValues (Web Crypto API), and the password is then shuffled using the same random source.",
    'Each character type you select appears at least once in the password. If no type is selected, or the length box is empty, no password is generated.',
    'Special characters come from this set of 29: !@#$%^&*()_+~`|}{[]:;?><,./-= (no spaces, quotes or backslashes).',
    'Avoid ambiguous characters removes only i, I, l, 0 and O. Similar-looking characters such as 1 and o can still appear.',
    "The password is generated in your browser. The tool's code makes no network request."
  ],
  faq: [
    {
      question: 'How do I generate a new password?',
      answer:
        'There is no Generate button. A password is created when the page loads, and a new one is created each time you change the length or tick or untick a checkbox.'
    },
    {
      question: 'What is the longest password I can create?',
      answer:
        '256 characters. If you enter a number above 256 it is changed to 256, and a number below 4 is changed to 4.'
    },
    {
      question: 'Why does the length change to 4 when I start typing?',
      answer:
        'Any value below 4 is replaced with 4 right away, including the first digit you type into an empty box. To set a length such as 16, edit the existing number (for example, change the 2 in 12 to a 6) or use the arrows on the box.'
    },
    {
      question: 'Which special characters can appear?',
      answer:
        'Only these: ! @ # $ % ^ & * ( ) _ + ~ ` | } { [ ] : ; ? > < , . / - =. Spaces, quotes and backslashes are never used.'
    }
  ]
};

export default content;

/**
 * SEO content for /xml/xml-beautifier. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/xml/xml-beautifier/service.ts lines 1-26
 * - src/pages/tools/xml/xml-beautifier/index.tsx lines 13-15, 37-71; public/locales/en/xml.json xmlBeautifier.inputTitle/resultTitle/options
 * - src/components/ToolContent.tsx lines 26-33; src/pages/tools/xml/xml-beautifier/index.tsx lines 32-35
 * - Ran the same XMLValidator/XMLParser/XMLBuilder calls as service.ts against node_modules/fast-xml-parser (5.2.5) under Node v22 in the
 * - src/pages/tools/xml/xml-beautifier/index.tsx lines 17-25; src/pages/tools/xml/xml-beautifier/xml-beautifier.service.test.ts
 * - grep of node_modules/fast-xml-parser/src and lib; grep of src for fetch/XMLHttpRequest/sendBeacon/axios; index.html
 * - src/components/input/ToolTextInput.tsx lines 31-47, 67; src/components/result/ToolTextResult.tsx lines 26-50; src/pages/tools/xml/xml-beautifier/index.tsx line 69; public/locales/en/translation.json inputFooter/resultFooter
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'XML Beautifier - Format and Indent XML Online | Orvulix',
  description:
    'Beautify compact XML with two-space indentation. Malformed XML is reported with a line and column, and you can keep or remove attributes before download.',
  howTo: [
    'Paste your XML into the Input XML box, or click Select files to load it from a file.',
    'Under Options, leave Preserve Attributes checked to keep element attributes, or uncheck it to remove them.',
    'Read the indented result in the Beautified XML box; it is rebuilt whenever you edit the input or change the option.',
    'Click Copy to clipboard, or Download to save the result as an .xml file.'
  ],
  examples: [
    {
      title: 'Compact XML',
      description:
        'Input: <root><item>1</item><item>2</item></root>. Output: <root> on the first line, each <item> on its own line indented by two spaces, and </root> on the last line.'
    },
    {
      title: 'Attributes on or off',
      description:
        'Input: <root><user id="42" role="admin">Alice</user></root>. With Preserve Attributes checked, the output keeps <user id="42" role="admin">Alice</user>. With it unchecked, the element becomes <user>Alice</user>.'
    },
    {
      title: 'Malformed XML',
      description:
        "Input: <root><a>1</b></root>. Output: Invalid XML: Expected closing tag 'a' (opened in line 1, col 7) instead of closing tag 'b'. (line 1, col 11)"
    }
  ],
  notes: [
    'The input is first checked with the XMLValidator from the fast-xml-parser library. Malformed XML returns an Invalid XML message with the line and column instead of formatted output.',
    'Output is always indented with two spaces. You cannot choose a different indent size or tabs.',
    'The XML is parsed into an object and then rebuilt. As a result, comments are removed, repeated sibling elements are grouped together, text mixed with child elements loses its original position, CDATA becomes escaped text, and empty elements such as <e/> are written as <e></e>.',
    'Text values are trimmed and number-like text is converted, so <a> 007 </a> becomes <a>7</a>.',
    'Neither the tool code nor the fast-xml-parser library it uses makes network requests, so the XML you paste or import is formatted in your browser.'
  ],
  faq: [
    {
      question: 'What does the Preserve Attributes option do?',
      answer:
        'When it is checked, attributes stay on their elements, for example <user id="42" role="admin">. When it is unchecked, all attributes are removed from the output, including the version and encoding in the <?xml ?> declaration.'
    },
    {
      question: 'Can I indent with tabs or four spaces?',
      answer:
        'No. The tool code sets the indentation to two spaces, and there is no option to change it.'
    },
    {
      question: 'Why were my XML comments removed?',
      answer:
        'The beautifier rebuilds the XML from a parsed object, and the parser is not set up to keep comments, so they are dropped from the output.'
    }
  ]
};

export default content;

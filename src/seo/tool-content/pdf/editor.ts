import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'PDF Editor - Optional SimplePDF Integration | Orvulix',
  description:
    'Review SimplePDF data handling before enabling its external PDF editor. Annotate, fill forms and sign PDFs, or choose other Orvulix PDF tools.',
  howTo: [
    'Read the external-service disclosure and SimplePDF privacy policy before opening a sensitive document.',
    'Choose Enable SimplePDF editor to connect to the external editor. It stays off by default.',
    'Choose a PDF inside the SimplePDF editor and use its editing controls.',
    'Choose Close SimplePDF editor to remove the embedded session, or browse other PDF tools.'
  ],
  notes: [
    'The editor is hosted by SimplePDF, not a local-only Orvulix renderer. It receives analytics and document metadata, including a document fingerprint.',
    'No editor iframe is created until you enable it. The choice is not saved; a new tool visit requires enabling it again.',
    'Closing removes the editor from this page and cannot recall information already sent. Review the provider policy for file handling and retention.',
    'Availability and editing behavior depend on SimplePDF. Other PDF tools have their own data-handling behavior.'
  ],
  faq: [
    {
      question: 'Does Orvulix load the external editor automatically?',
      answer:
        'No. Read the disclosure and select Enable SimplePDF editor to connect. Close SimplePDF editor removes the iframe; revisiting the tool starts with it off.'
    }
  ]
};
export default content;

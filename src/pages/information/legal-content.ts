import type { ContentSection } from '../../seo/types';

export const privacyPolicy = {
  title: 'Privacy Policy',
  description:
    'Read the Orvulix privacy policy: how browser-based tools, local preference storage, hosting request data and third-party resources are handled.',
  intro:
    'This policy explains how Orvulix handles information when you visit the website and use its tools. Orvulix does not currently require an account. Processing and network behavior vary by tool, so review the tool-specific notes before using sensitive information.',
  contactEmail: '99shadow.friend99@gmail.com',
  updated: 'November 16, 2026',
  sections: [
    {
      heading: 'Information and tool inputs',
      kind: 'paragraphs',
      paragraphs: [
        'Many tools process your input in your browser. Processing varies by tool, and some optional features or third-party integrations may send information to an external provider. Do not enter confidential, sensitive, or regulated information unless you have checked how that specific feature works.',
        'The local JSON Assistant and Regex Assistant demos keep input in page memory and do not persist it to browser storage or send it to an AI provider. Regex testing uses a local worker. Sample explanations and suggestions are authored, not AI-generated; a live Claude integration is not available.'
      ]
    },
    {
      heading: 'Browser storage',
      kind: 'paragraphs',
      paragraphs: [
        'Orvulix stores interface settings and selections in your browser’s local storage, including theme, language, tool filters, and bookmarked tools. This information remains in that browser until you clear its site data and is not an account profile.'
      ]
    },
    {
      heading: 'Hosting and third-party resources',
      kind: 'paragraphs',
      paragraphs: [
        'Hosting and content delivery providers serving the website may process technical request information such as IP address, requested page, referrer, timestamps, and browser or device details. Refer to those providers’ privacy policies for their processing and retention practices.',
        'Some tools load third-party scripts, libraries, models, or workers. A request to download one of these resources may expose technical request information to its provider, but downloading a resource does not by itself mean your tool input was uploaded. Whether input leaves your browser depends on the particular tool or integration.'
      ]
    },
    {
      heading: 'Retention and your choices',
      kind: 'paragraphs',
      paragraphs: [
        'Input handled only in a page or browser worker is generally kept in that page’s memory while you use the tool. Information sent to a third party is subject to that provider’s retention practices. You can clear Orvulix’s saved preferences by clearing this site’s local storage in your browser.',
        'Orvulix does not currently offer user accounts or a dedicated privacy request form. For privacy questions or requests, email 99shadow.friend99@gmail.com. This policy may be updated as features and integrations change. Last updated: November 16, 2026.'
      ]
    }
  ] satisfies ContentSection[]
};

export const termsAndConditions = {
  title: 'Terms and Conditions',
  description:
    'Read the Orvulix terms and conditions for using browser-based tools, your responsibilities, third-party services and important service limitations.',
  intro:
    'By accessing or using Orvulix, you agree to these terms. If you do not agree, do not use the website or its tools.',
  contactEmail: '99shadow.friend99@gmail.com',
  updated: 'November 16, 2026',
  sections: [
    {
      heading: 'Using the tools',
      kind: 'paragraphs',
      paragraphs: [
        'Orvulix provides browser-based utilities for general informational and productivity purposes. Features may change, be suspended, or become unavailable. You are responsible for having the rights and permissions needed to use any information or files you provide to a tool.',
        'Tool processing varies. Some tools work in your browser, while optional features may use third-party services. Review the relevant tool notes and the Privacy Policy before using sensitive data. You are responsible for keeping copies of important inputs and outputs.'
      ]
    },
    {
      heading: 'Acceptable use',
      kind: 'paragraphs',
      paragraphs: [
        'You may not use Orvulix to violate applicable laws or another person’s rights, distribute malicious code, interfere with or disrupt the website, probe or bypass its security controls, or impose an unreasonable load on the service.'
      ]
    },
    {
      heading: 'Outputs and professional advice',
      kind: 'paragraphs',
      paragraphs: [
        'Tools and their outputs are provided for convenience and may be incomplete, inaccurate, or unsuitable for your situation. Check results before relying on them. Orvulix does not provide legal, medical, financial, or other professional advice. Consult a qualified professional for decisions that require it.'
      ]
    },
    {
      heading: 'Third-party services',
      kind: 'paragraphs',
      paragraphs: [
        'Some features link to or integrate with services operated by others. Those services have their own terms and privacy policies. Orvulix does not control their services or the information they process.'
      ]
    },
    {
      heading: 'Intellectual property',
      kind: 'paragraphs',
      paragraphs: [
        'Orvulix and third-party software, content, and assets may be subject to separate copyright and license terms. Nothing in these terms changes the applicable open-source licenses or grants rights to third-party materials.'
      ]
    },
    {
      heading: 'Disclaimer and liability',
      kind: 'paragraphs',
      paragraphs: [
        'To the extent permitted by law, Orvulix is provided on an “as is” and “as available” basis, without warranties of accuracy, availability, or fitness for a particular purpose. To the extent permitted by law, Orvulix is not liable for indirect or consequential loss, loss of data, or loss arising from your use of or inability to use the service.'
      ]
    },
    {
      heading: 'Changes and contact',
      kind: 'paragraphs',
      paragraphs: [
        'These terms may be updated as Orvulix changes. The latest version will be posted on this page. For questions about these terms, email 99shadow.friend99@gmail.com. Last updated: November 16, 2026.'
      ]
    }
  ] satisfies ContentSection[]
};

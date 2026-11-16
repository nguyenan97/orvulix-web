import {
  Box,
  Container,
  Link as MuiLink,
  Stack,
  Typography
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { brand } from '../../brand/config';
import RoadmapBacklog from '../../seo/RoadmapBacklog'; // ORVULIX-ROADMAP

type Page = 'about' | 'roadmap' | 'contact' | 'privacy' | 'terms' | 'not-found';
const content: Record<Page, { title: string; paragraphs: string[] }> = {
  about: {
    title: 'About Orvulix',
    paragraphs: [
      'Making everyday digital tasks simpler, faster, and more accessible.',
      'Orvulix is an open-source platform that brings practical online tools together in one accessible workspace. Our goal is to help people work more efficiently with data, documents, images, and text without unnecessary complexity. We believe useful technology should be straightforward to understand and reliable enough for everyday use.',
      'What We Do',
      'Orvulix provides browser-based utilities for formatting JSON, converting data, preparing documents, editing images, and working with text. Instead of switching between multiple websites or installing separate applications, users can focus on completing their tasks. The platform is intended for developers, students, creators, professionals, and anyone looking for practical online tools.',
      'Our Mission',
      'Our mission is to make useful digital tools accessible to everyone. We focus on simplicity, reliability, and accessibility. A good tool should be intuitive, produce clear results, and support users with different backgrounds and levels of technical experience.',
      'Our Approach',
      'We prioritize a better experience over simply increasing the number of tools. Our development work focuses on performance, usability, accessibility, device compatibility, clear instructions, practical examples, and meaningful error messages. We want Orvulix to become a platform people return to because it consistently solves real problems.',
      'Building with Open Source',
      'Orvulix is independently maintained as an open-source project based on OmniTools. We appreciate the original author and contributors, preserve the original licensing and attribution, and welcome improvements from the community. Open source supports transparency, collaboration, learning, and continuous improvement. Core utilities are currently available free of charge.',
      'Exploring the Future of AI',
      'Local JSON Assistant and Regex Assistant demos illustrate possible future assistant workflows. Explanations and suggestions are authored samples, not AI-generated. JSON schema validation and regex testing run locally; a live Claude integration is not available. Future AI assistance should emphasize accuracy, transparency, privacy, and user control.',
      'Our Long-Term Vision',
      'We aim to make Orvulix a dependable destination for everyday digital productivity. Our priorities will evolve through practical experimentation, technical improvements, and user feedback. We value sustainable progress over unnecessary complexity and meaningful improvements over feature count.',
      'Help Us Build Something Useful',
      'Orvulix is an evolving project, and community feedback helps shape its direction. Explore our roadmap, visit our public GitHub repository, or contact us at founder@orvulix.io.vn to share a suggestion, report a problem, or discuss a contribution.'
    ]
  },
  roadmap: {
    title: 'Orvulix Product Roadmap',
    paragraphs: [
      'Simple tools. Smarter workflows. Better productivity.',
      'Orvulix brings useful browser-based tools together in one accessible workspace. Our roadmap focuses on making everyday tasks easier, improving the tools people already use, and exploring thoughtful ways to connect them. We prioritize real usefulness over the number of features shipped.',
      '1. Better everyday tools - Current focus',
      'We are improving speed, mobile usability, accessibility, navigation, and reliability. Clearer instructions, practical examples, and helpful error messages will make it easier to choose a tool and complete a task with confidence.',
      '2. Practical AI assistance - Planned',
      'The JSON Assistant demo provides authored explanations for three samples and local candidate schema inference and structural validation. It does not call Claude or generate AI responses. A live AI assistant remains planned, with review and deterministic validation of proposed outputs. Depending on feedback, we may explore assisted data conversion, regex, document, and text workflows.',
      '3. Connected workflows - Exploring',
      'Many tasks involve several steps. We want to explore ways to move between compatible tools with less copying and pasting, including previewable conversions and reusable workflows. One possible flow is to inspect JSON, validate it, convert it to CSV, and export the result.',
      '4. Open and sustainable growth - Ongoing',
      'We plan to keep core utilities free, welcome contributions, improve documentation, and prioritize feedback from people using the tools. Privacy, accessibility, maintenance effort, and operating costs will shape what we build.',
      'How we decide what comes next',
      'First, strengthen existing tools. Next, prototype one focused improvement, test it with real use cases, and gather feedback. Expand only when the feature is useful, reliable, and practical to maintain. We are not committing to release dates before those conditions are met.',
      'What is next',
      'Local JSON Assistant and Regex Assistant demos are implemented with authored examples and deterministic processing. Live Claude assistance and connected workflows remain plans. Follow our public roadmap for milestones and technical considerations.',
      'Help shape Orvulix',
      'Ideas, bug reports, documentation improvements, and contributions are welcome. Contact founder@orvulix.io.vn or explore the public GitHub repository.'
    ]
  },
  contact: {
    title: 'Contact Orvulix',
    paragraphs: [
      'Questions, ideas, or feedback? We would love to hear from you.',
      'Orvulix is built around a simple idea: useful tools become better when the people using them have a voice in how they evolve. Whether you have a question, discover an issue, want to suggest an improvement, or are interested in contributing, your feedback is welcome.',
      'Get in Touch',
      'For general inquiries, product feedback, collaboration opportunities, and other questions, email founder@orvulix.io.vn. Please include a clear subject and a short description. If your inquiry concerns a specific tool, include its name or page URL to provide useful context.',
      'Report an Issue',
      'If you encounter a problem, tell us which tool or page was involved, what you were trying to accomplish, the steps needed to reproduce the issue, what happened, and what you expected instead. Browser and device information may help us investigate. Use non-sensitive examples whenever possible.',
      'Suggest a Feature',
      'Have an idea for a new tool or an improvement to an existing one? Describe the task you want to complete, the difficulties you currently face, and how the proposed feature could help. We evaluate ideas based on practical usefulness, technical feasibility, accessibility, and long-term maintainability.',
      'Open-Source Contributions',
      'Orvulix is independently maintained as an open-source project. Contributions to code, documentation, testing, and accessibility are welcome. Our public GitHub repository contains the source code, contribution guidelines, and product roadmap. Focused contributions that make the platform more useful and reliable are especially valuable.',
      'Collaboration and Partnerships',
      'We welcome conversations with developers, educators, individuals, and organizations interested in practical productivity tools and open-source technology. Potential areas include technical contributions, accessibility, educational use cases, documentation, and future product development.',
      'Privacy and Responsible Communication',
      'Please avoid sending passwords, API keys, access tokens, confidential documents, or unnecessary personal information. If you believe you have discovered a security or privacy issue, contact us directly by email rather than publishing sensitive details publicly.',
      'Response Expectations',
      'Orvulix is independently maintained, so response times may vary. We cannot guarantee an immediate reply or a specific delivery date, but constructive feedback helps us prioritize improvements.',
      'Thank You for Being Part of Orvulix',
      'Every useful suggestion, issue report, and contribution helps us understand how to make Orvulix better. Thank you for helping us build a practical, accessible, and continuously improving collection of tools.'
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    paragraphs: [
      'This policy describes how Orvulix handles information when you visit the website and use its tools. Orvulix does not currently require an account. Processing and network behavior vary by tool, so review the tool-specific notes before using sensitive information.',
      'Information and tool inputs',
      'Many tools process your input in your browser. Orvulix does not operate a general-purpose upload service for every tool, but some optional features and third-party integrations may send information to an external provider for processing. Do not enter confidential, sensitive, or regulated information unless you have checked how that specific feature works.',
      'The local JSON Assistant and Regex Assistant demos keep input in page memory and do not persist it to browser storage or send it to an AI provider. Regex testing uses a local worker. Sample explanations and suggestions are authored, not AI-generated; a live Claude integration is not available.',
      'The PDF Editor has an optional SimplePDF integration that stays off until you enable it. When enabled, SimplePDF may process your document and receives analytics and document metadata, including a document fingerprint. Review SimplePDF’s privacy policy before using it with sensitive files. Closing the editor cannot recall information already sent.',
      'Browser storage',
      'Orvulix stores interface settings and selections in your browser’s local storage, including theme, language, tool filters, and bookmarked tools. This information remains in that browser until you clear its site data. It is not an account profile.',
      'Hosting and third-party resources',
      'The hosting and content delivery providers serving the website may process technical request information such as IP address, requested page, referrer, timestamps, and browser or device details. Their privacy policies describe their own handling and retention practices.',
      'Some tools load third-party scripts, libraries, models, or workers. A request to download one of these resources may expose technical request information to its provider, but downloading a resource does not by itself mean your tool input was uploaded. Whether input leaves your browser depends on the particular tool or integration.',
      'Retention and your choices',
      'Input handled only in a page or browser worker is generally kept in that page’s memory while you use the tool. Information sent to a third party is subject to that provider’s retention practices. You can clear Orvulix’s saved preferences by clearing this site’s local storage in your browser.',
      'Orvulix does not currently offer user accounts or a dedicated privacy request form. For privacy questions or requests, email 99shadow.friend99@gmail.com. This policy may be updated as the service changes. Last updated: November 16, 2026.'
    ]
  },
  terms: {
    title: 'Terms and Conditions',
    paragraphs: [
      'By accessing or using Orvulix, you agree to these terms. If you do not agree, do not use the website or its tools.',
      'Using the tools',
      'Orvulix provides browser-based utilities for general informational and productivity purposes. Features may change, be suspended, or become unavailable. You are responsible for having the rights and permissions needed to use any information or files you provide to a tool.',
      'Tool processing varies. Some tools work in your browser, while optional features may use third-party services. Review the relevant tool notes and the Privacy Policy before using sensitive data. You are responsible for keeping copies of important inputs and outputs.',
      'Acceptable use',
      'You may not use Orvulix to violate applicable laws or another person’s rights, distribute malicious code, interfere with or disrupt the website, probe or bypass its security controls, or impose an unreasonable load on the service.',
      'Outputs and professional advice',
      'Tools and their outputs are provided for convenience and may be incomplete, inaccurate, or unsuitable for your situation. Check results before relying on them. Orvulix does not provide legal, medical, financial, or other professional advice, and you should consult a qualified professional for decisions that require it.',
      'Third-party services',
      'Some features link to or integrate with services operated by others, including the optional SimplePDF integration in the PDF Editor. Those services have their own terms and privacy policies. Orvulix does not control their services or the information they process.',
      'Intellectual property',
      'Orvulix and third-party software, content, and assets may be subject to separate copyright and license terms. Nothing in these terms changes the applicable open-source licenses or grants rights to third-party materials.',
      'Disclaimer and liability',
      'To the extent permitted by law, Orvulix is provided on an “as is” and “as available” basis, without warranties of accuracy, availability, or fitness for a particular purpose. To the extent permitted by law, Orvulix is not liable for indirect or consequential loss, loss of data, or loss arising from your use of or inability to use the service.',
      'Changes and contact',
      'These terms may be updated as Orvulix changes. The latest version will be posted on this page. For questions about these terms, email 99shadow.friend99@gmail.com. Last updated: November 16, 2026.'
    ]
  },
  'not-found': {
    title: 'Page not found',
    paragraphs: [
      'The page you requested does not exist. Return to the homepage to explore available tools.'
    ]
  }
};

export default function InformationPage({ page }: { page: Page }) {
  const { pathname } = useLocation();
  const details = content[page];
  const url = 'https://orvulix.io.vn' + pathname;
  const contactEmail =
    page === 'privacy' || page === 'terms'
      ? '99shadow.friend99@gmail.com'
      : 'founder@orvulix.io.vn';
  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 9 }, minHeight: '65vh' }}>
      <Helmet>
        <title>
          {details.title} - {brand.name}
        </title>
        <meta
          name="description"
          content={
            page === 'roadmap'
              ? 'Explore the Orvulix product roadmap: better everyday tools, practical AI assistance, connected workflows, and open-source improvements.'
              : page === 'about'
                ? 'Learn about Orvulix, a free open-source workspace for browser-based JSON, PDF, image, text, and data tools.'
                : page === 'contact'
                  ? 'Contact Orvulix with feedback, feature suggestions, bug reports, and collaboration inquiries.'
                  : page === 'privacy'
                    ? 'Learn what information Orvulix browser-based tools and third-party integrations may process, and how browser storage is used.'
                    : page === 'terms'
                      ? 'Read the terms and conditions for using Orvulix and its browser-based tools.'
                      : details.paragraphs[0]
          }
        />
        {page === 'not-found' ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <link rel="canonical" href={url} />
        )}
        {page === 'roadmap' && (
          <meta property="og:title" content="Orvulix Product Roadmap" />
        )}
        {page === 'roadmap' && (
          <meta
            property="og:description"
            content="Our plans for more reliable online tools, optional AI assistance, connected workflows, and community-driven improvements."
          />
        )}
      </Helmet>
      <Stack spacing={3}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          {details.title}
        </Typography>
        {details.paragraphs.map((paragraph, index) => {
          const headings: Partial<Record<Page, string[]>> = {
            about: [
              'What We Do',
              'Our Mission',
              'Our Approach',
              'Building with Open Source',
              'Exploring the Future of AI',
              'Our Long-Term Vision',
              'Help Us Build Something Useful'
            ],
            roadmap: [
              '1. Better everyday tools - Current focus',
              '2. Practical AI assistance - Planned',
              '3. Connected workflows - Exploring',
              '4. Open and sustainable growth - Ongoing',
              'How we decide what comes next',
              'What is next',
              'Help shape Orvulix'
            ],
            contact: [
              'Get in Touch',
              'Report an Issue',
              'Suggest a Feature',
              'Open-Source Contributions',
              'Collaboration and Partnerships',
              'Privacy and Responsible Communication',
              'Response Expectations',
              'Thank You for Being Part of Orvulix'
            ],
            privacy: [
              'Information and tool inputs',
              'Browser storage',
              'Hosting and third-party resources',
              'Retention and your choices'
            ],
            terms: [
              'Using the tools',
              'Acceptable use',
              'Outputs and professional advice',
              'Third-party services',
              'Intellectual property',
              'Disclaimer and liability',
              'Changes and contact'
            ]
          };
          const isHeading = headings[page]?.includes(paragraph) ?? false;
          const isTagline =
            index === 0 &&
            (page === 'about' || page === 'roadmap' || page === 'contact');
          return (
            <Typography
              key={paragraph}
              component={isHeading ? 'h2' : 'p'}
              variant={isHeading ? 'h5' : isTagline ? 'h6' : 'body1'}
              fontWeight={isHeading ? 700 : isTagline ? 600 : 400}
              sx={{ lineHeight: isHeading ? 1.4 : 1.9, mt: isHeading ? 2 : 0 }}
            >
              {paragraph}
            </Typography>
          );
        })}
        {page === 'roadmap' && <RoadmapBacklog />} {/* ORVULIX-ROADMAP */}
        {(page === 'about' ||
          page === 'roadmap' ||
          page === 'contact' ||
          page === 'privacy' ||
          page === 'terms') && (
          <MuiLink href={`mailto:${contactEmail}`}>{contactEmail}</MuiLink>
        )}
        {page === 'roadmap' && (
          <MuiLink component={Link} to="/json-assistant">
            Try the local JSON Assistant demo
          </MuiLink>
        )}
        {page === 'roadmap' && (
          <MuiLink component={Link} to="/regex-assistant">
            Try the local Regex Assistant demo
          </MuiLink>
        )}
        {page === 'roadmap' && (
          <MuiLink
            href="https://github.com/nguyenan97/orvulix-web/blob/main/docs/PRODUCT_ROADMAP.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            View the detailed product roadmap
          </MuiLink>
        )}
        {page === 'contact' && (
          <MuiLink
            href="https://github.com/nguyenan97/orvulix-web"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Orvulix on GitHub
          </MuiLink>
        )}
        <Box>
          <Link to="/">Back to Orvulix home</Link>
        </Box>
      </Stack>
    </Container>
  );
}

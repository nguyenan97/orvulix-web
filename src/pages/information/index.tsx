import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { brand } from '../../brand/config';

type Page = 'about' | 'roadmap' | 'contact' | 'privacy' | 'terms' | 'not-found';
const content: Record<Page, { title: string; paragraphs: string[] }> = {
  about: {
    title: 'About Orvulix',
    paragraphs: [
      'Orvulix brings practical online tools together in one simple workspace. Whether you are formatting JSON, converting data, working with documents, editing images, or preparing text, our goal is to help you finish everyday tasks with less friction.',
      'Built for developers, students, creators, and anyone who needs reliable utilities, Orvulix focuses on straightforward workflows, clear results, and tools that are easy to access without unnecessary setup.',
      'Our priorities are to improve the tools already available, make the experience faster and more accessible across devices, and help people find the right tool for the job. We want the platform to earn repeat visits by being genuinely useful.',
      'Orvulix is independently maintained as an open-source project based on OmniTools, with credit to the original contributors. Core utilities are currently free, and community feedback helps guide improvements.',
      'We are exploring optional AI assistance for tasks where it can make a meaningful difference, starting with a proposed JSON Assistant. AI features are not yet available, and any future integration will be designed around clear user consent, output review, and transparent data handling.',
      'Explore our product roadmap to see what we are improving and what we are considering next.'
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
      'Our first proposed AI prototype is a JSON Assistant that explains complex payloads, suggests candidate JSON schemas, and helps users understand possible transformations. Outputs would be reviewed and validated using deterministic tools. Depending on feedback, we may explore assisted data conversion, regex, document, and text workflows.',
      '3. Connected workflows - Exploring',
      'Many tasks involve several steps. We want to explore ways to move between compatible tools with less copying and pasting, including previewable conversions and reusable workflows. One possible flow is to inspect JSON, validate it, convert it to CSV, and export the result.',
      '4. Open and sustainable growth - Ongoing',
      'We plan to keep core utilities free, welcome contributions, improve documentation, and prioritize feedback from people using the tools. Privacy, accessibility, maintenance effort, and operating costs will shape what we build.',
      'How we decide what comes next',
      'First, strengthen existing tools. Next, prototype one focused improvement, test it with real use cases, and gather feedback. Expand only when the feature is useful, reliable, and practical to maintain. We are not committing to release dates before those conditions are met.',
      'What is next',
      'Our immediate focus is the existing Orvulix experience and an initial AI JSON Assistant prototype. AI assistance and connected workflows described here are plans, not released features. Follow our public roadmap for more detailed milestones and technical considerations.',
      'Help shape Orvulix',
      'Ideas, bug reports, documentation improvements, and contributions are welcome. Contact founder@orvulix.io.vn or explore the public GitHub repository.'
    ]
  },
  contact: {
    title: 'Contact Orvulix',
    paragraphs: [
      'Have a question, an idea for a tool, or feedback about your experience? We would like to hear from you.',
      'For general questions, feature suggestions, accessibility feedback, or collaboration inquiries, email founder@orvulix.io.vn. Please include the tool name or page URL when your message relates to a specific feature.',
      'Found a bug? Tell us what you were trying to do, what happened, and how to reproduce the issue. Browser and device details can help us investigate. Please do not include passwords, API keys, or sensitive files.',
      'Orvulix is independently maintained, so response times may vary. We read feedback and use it to guide improvements, but cannot promise a specific response or delivery date.',
      'Interested in contributing? Visit our GitHub repository for source code, contribution guidelines, and the product roadmap.'
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    paragraphs: [
      'Orvulix provides a collection of browser-based utilities. Many tools process inputs in your browser, but behavior varies by tool and some features may use external services.',
      'Do not enter confidential, sensitive or regulated information unless you have verified how the particular tool processes it.',
      'The site may store interface preferences, such as theme and language, in browser local storage.',
      'Hosting infrastructure may process technical request data such as IP addresses and browser information. Refer to the hosting provider’s privacy documentation for its processing practices.',
      'Some utilities may load third-party scripts, libraries, models, or other resources. Data processing and network behavior may differ between tools; review the specific tool and avoid sensitive inputs unless you understand its behavior.',
      'The planned AI JSON Assistant is not currently available. If introduced, its data processing and external AI provider disclosures will be published before launch.',
      'We do not currently offer user accounts or a dedicated privacy request form. For privacy questions, email founder@orvulix.io.vn.',
      'This policy may be updated as features and integrations change. Last updated: October 8, 2026.'
    ]
  },
  terms: {
    title: 'Terms of Use',
    paragraphs: [
      'Orvulix tools are provided for general informational and productivity purposes on an as-is basis, without warranties of accuracy, availability or fitness for a particular purpose.',
      'You are responsible for reviewing outputs before relying on them, especially for financial, legal, medical or security-sensitive decisions.',
      'Do not use the website for unlawful activities or to interfere with its availability or security.',
      'Third-party tools and services, when linked or integrated, may have their own terms.',
      'These terms may change as the service evolves. Last updated: October 8, 2026.'
    ]
  },
  'not-found': {
    title: 'Page not found',
    paragraphs: ['The page you requested does not exist. Return to the homepage to explore available tools.']
  }
};

export default function InformationPage({ page }: { page: Page }) {
  const { pathname } = useLocation();
  const details = content[page];
  const url = 'https://orvulix.io.vn' + pathname;
  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 9 }, minHeight: '65vh' }}>
      <Helmet>
        <title>{details.title} - {brand.name}</title>
        <meta name="description" content={page === 'roadmap' ? 'Explore the Orvulix product roadmap: better everyday tools, practical AI assistance, connected workflows, and open-source improvements.' : page === 'about' ? 'Learn about Orvulix, a free open-source workspace for browser-based JSON, PDF, image, text, and data tools.' : page === 'contact' ? 'Contact Orvulix with feedback, feature suggestions, bug reports, and collaboration inquiries.' : details.paragraphs[0]} />
        {page === 'not-found' ? <meta name="robots" content="noindex, nofollow" /> : <link rel="canonical" href={url} />}
        {page === 'roadmap' && <meta property="og:title" content="Orvulix Product Roadmap" />}
        {page === 'roadmap' && <meta property="og:description" content="Our plans for more reliable online tools, optional AI assistance, connected workflows, and community-driven improvements." />}
      </Helmet>
      <Stack spacing={3}>
        <Typography variant="h3" component="h1" fontWeight={800}>{details.title}</Typography>
        {details.paragraphs.map((paragraph) => <Typography key={paragraph} variant="body1" sx={{ lineHeight: 1.9 }}>{paragraph}</Typography>)}
        {(page === 'about' || page === 'roadmap' || page === 'contact' || page === 'privacy') && (
          <MuiLink href="mailto:founder@orvulix.io.vn">founder@orvulix.io.vn</MuiLink>
        )}
        {page === 'roadmap' && (
          <MuiLink href="https://github.com/nguyenan97/orvulix-web/blob/main/docs/PRODUCT_ROADMAP.md" target="_blank" rel="noopener noreferrer">Detailed roadmap and proposed technical architecture</MuiLink>
        )}
        {page === 'contact' && (
          <MuiLink href="https://github.com/nguyenan97/orvulix-web" target="_blank" rel="noopener noreferrer">Explore Orvulix on GitHub</MuiLink>
        )}
        <Box><Link to="/">Back to Orvulix home</Link></Box>
      </Stack>
    </Container>
  );
}

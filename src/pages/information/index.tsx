import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { brand } from '../../brand/config';

type Page = 'about' | 'roadmap' | 'contact' | 'privacy' | 'terms' | 'not-found';
const content: Record<Page, { title: string; paragraphs: string[] }> = {
  about: {
    title: 'About Orvulix',
    paragraphs: [
      'Orvulix is an independently developed online tools project, available at orvulix.io.vn.',
      'The product brings practical browser-based utilities for developers and everyday users into one place, including tools for JSON, text, PDF documents, images, and data conversion.',
      'Our focus is making frequently used utilities accessible without unnecessary setup. Tool behavior and data processing can vary; check individual tools before entering sensitive information.',
      'Product roadmap: we are exploring optional AI-assisted workflows for explaining, transforming, and validating user-provided content. These capabilities are planned, not currently available as a Claude integration.',
      'For product inquiries, feedback, or partnership discussions, email founder@orvulix.io.vn.'
    ]
  },
  roadmap: {
    title: 'Product Roadmap',
    paragraphs: [
      'Orvulix is developing a collection of free online utilities for developers and everyday users. This roadmap describes planned work and does not promise release dates.',
      'Planned AI JSON Assistant: an optional Claude-powered feature to explain JSON structures, provide plain-language validation guidance, and suggest transformations. This feature is not implemented or available today.',
      'Before any AI release, we plan to add explicit user consent before sending inputs to an external AI provider, server-side API access, input limits, abuse protection, cost controls, and an updated privacy notice.',
      'Other priorities include improving accessibility, mobile usability, discoverability, and reliability of existing tools.',
      'We welcome product feedback at founder@orvulix.io.vn.'
    ]
  },
  contact: {
    title: 'Contact',
    paragraphs: [
      'Questions, feedback or a bug report? Email founder@orvulix.io.vn or open an issue on our public GitHub repository.'
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
        <meta name="description" content={details.paragraphs[0]} />
        {page === 'not-found' ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={url} />}
      </Helmet>
      <Stack spacing={3}>
        <Typography variant="h3" component="h1" fontWeight={800}>{details.title}</Typography>
        {details.paragraphs.map((paragraph) => <Typography key={paragraph} variant="body1" sx={{ lineHeight: 1.9 }}>{paragraph}</Typography>)}
        {(page === 'about' || page === 'roadmap' || page === 'contact' || page === 'privacy') && (
          <MuiLink href="mailto:founder@orvulix.io.vn">founder@orvulix.io.vn</MuiLink>
        )}
        {(page === 'contact' || page === 'privacy') && (
          <MuiLink href="https://github.com/nguyenan97/orvulix-web/issues" target="_blank" rel="noopener noreferrer">Contact through GitHub Issues</MuiLink>
        )}
        <Box><Link to="/">Back to Orvulix home</Link></Box>
      </Stack>
    </Container>
  );
}

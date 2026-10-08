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
    title: 'Orvulix AI Product Roadmap',
    paragraphs: [
      'Orvulix is an open-source collection of free online tools for JSON, PDF, images, text, and developer workflows. We are exploring optional AI features powered by Claude to help users understand and transform complex content. All AI initiatives below are proposals, not released features.',
      'Phase 1 — AI JSON Assistant (planned): explain nested JSON, identify likely schema issues, propose JSON Schema, and suggest safe transformations. Deterministic formatting and validation remain available without AI.',
      'Phase 1 — Smart Data Converter (planned): generate editable mappings between JSON, CSV, YAML, and XML; explain field mismatches and preview transformations before applying them.',
      'Phase 1 — Regex and Developer Assistant (planned): translate plain-language requirements into regex examples, explain existing patterns, generate test cases, and highlight potentially expensive patterns.',
      'Phase 2 — API Payload Inspector (planned): explain HTTP requests and responses, compare API payload versions, suggest contract tests, and produce human-readable change summaries.',
      'Phase 2 — Document Understanding (planned): summarize user-selected PDF text, extract structured fields with confirmation, and help compare document revisions. Support will depend on file handling, privacy, and cost constraints.',
      'Phase 2 — Image Accessibility Assistant (planned): propose descriptive alt text and useful image metadata for user-selected images, with human review before publication.',
      'Phase 2 — AI Text Transformation (planned): rewrite, translate, summarize, and structure user-selected text while preserving user control over the final output.',
      'Phase 3 — Workflow Builder (research): connect multiple tools into opt-in, reviewable workflows; for example, parse a JSON response, validate its schema, generate a CSV mapping, and export a report.',
      'Phase 3 — AI Tool Discovery (research): recommend the most relevant existing Orvulix tool based on a natural-language task, without claiming actions have been performed.',
      'Phase 3 — Open-source Developer SDK (research): provide documented APIs or reusable components for building privacy-conscious AI-assisted utilities.',
      'Proposed Claude architecture: explicit user opt-in; Netlify Functions or another server-side service to call the Anthropic API; no browser-exposed API keys; input size and rate limits; spending caps; privacy notices; and human confirmation for suggested changes.',
      'Delivery priorities: prototype one narrow JSON workflow first, validate usefulness and operating cost, then consider additional tools. This roadmap does not indicate a live Claude integration, customer traction, funding, or acceptance into any startup program.',
      'Community contributions and feature feedback are welcome through the Orvulix GitHub repository or founder@orvulix.io.vn.'
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
        <meta name="description" content={page === 'roadmap' ? 'Explore planned Claude-powered AI tools for JSON, data conversion, API debugging, PDF understanding, regex, and developer workflows at Orvulix.' : details.paragraphs[0]} />
        {page === 'not-found' ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={url} />}
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
        {(page === 'contact' || page === 'privacy') && (
          <MuiLink href="https://github.com/nguyenan97/orvulix-web/issues" target="_blank" rel="noopener noreferrer">Contact through GitHub Issues</MuiLink>
        )}
        <Box><Link to="/">Back to Orvulix home</Link></Box>
      </Stack>
    </Container>
  );
}

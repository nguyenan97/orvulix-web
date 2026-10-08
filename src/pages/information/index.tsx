import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { brand } from '../../brand/config';

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
      'We are exploring ways AI could complement traditional tools rather than replace them. Our first proposed initiative is a JSON Assistant to help users understand complex data structures, generate candidate schemas, and explore transformations. Additional ideas include data conversion, document understanding, and connected workflows. These AI features are not currently available. Any future integration should emphasize accuracy, transparency, privacy, and user control.',
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
        {details.paragraphs.map((paragraph, index) => {
          const headings: Partial<Record<Page, string[]>> = {
            about: ['What We Do', 'Our Mission', 'Our Approach', 'Building with Open Source', 'Exploring the Future of AI', 'Our Long-Term Vision', 'Help Us Build Something Useful'],
            roadmap: ['1. Better everyday tools - Current focus', '2. Practical AI assistance - Planned', '3. Connected workflows - Exploring', '4. Open and sustainable growth - Ongoing', 'How we decide what comes next', 'What is next', 'Help shape Orvulix'],
            contact: ['Get in Touch', 'Report an Issue', 'Suggest a Feature', 'Open-Source Contributions', 'Collaboration and Partnerships', 'Privacy and Responsible Communication', 'Response Expectations', 'Thank You for Being Part of Orvulix']
          };
          const isHeading = headings[page]?.includes(paragraph) ?? false;
          const isTagline = index === 0 && (page === 'about' || page === 'roadmap' || page === 'contact');
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
        {(page === 'about' || page === 'roadmap' || page === 'contact' || page === 'privacy') && (
          <MuiLink href="mailto:founder@orvulix.io.vn">founder@orvulix.io.vn</MuiLink>
        )}
        {page === 'roadmap' && (
          <MuiLink href="https://github.com/nguyenan97/orvulix-web/blob/main/docs/PRODUCT_ROADMAP.md" target="_blank" rel="noopener noreferrer">View the detailed product roadmap</MuiLink>
        )}
        {page === 'contact' && (
          <MuiLink href="https://github.com/nguyenan97/orvulix-web" target="_blank" rel="noopener noreferrer">Explore Orvulix on GitHub</MuiLink>
        )}
        <Box><Link to="/">Back to Orvulix home</Link></Box>
      </Stack>
    </Container>
  );
}

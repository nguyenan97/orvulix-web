/**
 * SEO definitions for the non-tool routes declared in
 * src/config/routesConfig.tsx. Every static route there must have an entry
 * here (enforced at build time and by tests). Copy is English and must only
 * state facts that the corresponding page states.
 */

export interface StaticPageSeo {
  title: string;
  description: string;
  heading: string;
  intro: string;
  /** schema.org type of the page. */
  schemaType: 'WebPage' | 'AboutPage' | 'ContactPage';
}

export const HOME_SEO = {
  title: 'Orvulix - Free Online Tools for JSON, PDF, Images & More',
  description:
    'Free online tools for JSON formatting, PDF tasks, images, text, data conversion and developer workflows. Explore Orvulix in your browser.',
  heading: 'Everyday tools. Everywhere.',
  intro:
    'Orvulix brings JSON utilities, document tools, image tools, text processing and data conversion into one place. Browse the categories below to choose the right tool for your task.',
  linksHeading: 'Tool categories'
} as const;

/** Keyed by route path as declared in routesConfig. */
export const INFO_PAGES_SEO: Record<string, StaticPageSeo> = {
  '/about': {
    title: 'About Orvulix - Free Open-Source Online Tools',
    description:
      'Learn about Orvulix, a free open-source collection of browser-based tools for JSON, PDF, images, text and data, and the mission behind the project.',
    heading: 'About Orvulix',
    intro:
      'Making everyday digital tasks simpler, faster, and more accessible.',
    schemaType: 'AboutPage'
  },
  '/roadmap': {
    title: 'Orvulix Product Roadmap - Plans and Priorities',
    description:
      'Explore the Orvulix product roadmap: better everyday tools, practical AI assistance, connected workflows, and open-source improvements.',
    heading: 'Orvulix Product Roadmap',
    intro: 'Simple tools. Smarter workflows. Better productivity.',
    schemaType: 'WebPage'
  },
  '/contact': {
    title: 'Contact Orvulix - Feedback, Bug Reports and Ideas',
    description:
      'Contact Orvulix with questions, product feedback, feature suggestions, bug reports and collaboration inquiries by email at founder@orvulix.io.vn.',
    heading: 'Contact Orvulix',
    intro: 'Questions, ideas, or feedback? We would love to hear from you.',
    schemaType: 'ContactPage'
  },
  '/privacy': {
    title: 'Privacy Policy | Orvulix',
    description:
      'Read the Orvulix privacy policy: how browser-based tools, local preference storage, hosting request data and third-party resources are handled.',
    heading: 'Privacy Policy',
    intro:
      'Orvulix provides a collection of browser-based utilities. Many tools process inputs in your browser, but behavior varies by tool and some features may use external services.',
    schemaType: 'WebPage'
  },
  '/terms': {
    title: 'Terms of Use | Orvulix',
    description:
      'Read the Orvulix terms of use: tools are provided as-is without warranties, review outputs before relying on them, and do not use the site unlawfully.',
    heading: 'Terms of Use',
    intro:
      'Orvulix tools are provided for general informational and productivity purposes on an as-is basis, without warranties of accuracy, availability or fitness for a particular purpose.',
    schemaType: 'WebPage'
  }
};

export const NOT_FOUND_SEO = {
  title: 'Page Not Found | Orvulix',
  description:
    'The page you requested does not exist. Return to the Orvulix homepage to explore the available online tools.',
  heading: 'Page not found',
  intro:
    'The page you requested does not exist. Return to the homepage to explore available tools.'
} as const;

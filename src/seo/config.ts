import { brand } from '../brand/config';

/**
 * Site-wide SEO constants. Only facts that are verifiable in this repository
 * (README, information pages, brand config) belong here.
 */
export const SITE = {
  origin: 'https://orvulix.io.vn',
  name: brand.name,
  tagline: brand.tagline,
  /** Language of the build-time HTML and of all hand-written SEO copy. */
  language: 'en',
  contactEmail: 'founder@orvulix.io.vn',
  repositoryUrl: 'https://github.com/nguyenan97/orvulix-web',
  /** Brand mark used as the Organization logo (the PNG icons are not Orvulix-branded). */
  logoPath: '/favicon.svg',
  robotsIndex: 'index, follow, max-image-preview:large',
  robotsNoIndex: 'noindex, follow',
  /** Default social image (public/og-default.png). */
  image: {
    path: '/og-default.png',
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: 'Orvulix logo with the text: Everyday tools. Everywhere. Free online tools for JSON, PDF, images, text and more.'
  }
} as const;

/** Editorial limits used by the project (not a Google display guarantee). */
export const LIMITS = {
  titleMax: 60,
  descriptionMin: 120,
  descriptionMax: 155
} as const;

export const absoluteUrl = (path: string): string =>
  path === '/' ? `${SITE.origin}/` : `${SITE.origin}${path}`;

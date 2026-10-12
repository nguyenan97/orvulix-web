import type { ContentSection } from './types';

export const ROADMAP_BACKLOG_HEADING = 'Planned features';
export const ROADMAP_BACKLOG_NOTICE =
  'These features are planned, not available yet. Priority indicates the proposed order, not a release date. Scope and order may change after testing and feedback.';
export const ROADMAP_FOUNDATION =
  'Before new features, we will address regex-related browser freezes, review PDF Editor data handling, and investigate clipboard reliability.';
export const ROADMAP_BACKLOG_URL =
  'https://github.com/nguyenan97/orvulix-web/blob/develop/docs/FEATURE_BACKLOG.md';

// Public summaries of docs/FEATURE_BACKLOG.md, in the same proposed order.
// Keep this module React-free so prerender and UI use the same copy.
export const PLANNED_FEATURES = [
  {
    title: 'Text Workflow Builder',
    benefit:
      'Combine text transformations into reusable steps and preview each result without copying between tools.'
  },
  {
    title: 'Docker Run to Compose',
    benefit:
      'Turn common docker run options into Compose YAML, with warnings for unsupported options. Commands will not be executed.'
  },
  {
    title: 'File Checksum Calculator',
    benefit:
      'Calculate SHA-256 or SHA-512 for local files and compare the result with an expected checksum.'
  },
  {
    title: 'Data Transfer Time Calculator',
    benefit:
      'Estimate transfer time from file size and connection speed, with clear bits, bytes and unit choices.'
  },
  {
    title: 'Subnet Calculator',
    benefit:
      'Inspect IPv4 networks, subnet masks and host ranges from a CIDR address. IPv6 will be evaluated later.'
  },
  {
    title: 'Lossless PNG Optimizer',
    benefit:
      'Explore smaller PNG files while preserving dimensions and pixels, and keep the original when optimization does not help.'
  },
  {
    title: 'Batch OCR',
    benefit:
      'Extract text from multiple images with language selection, progress, cancellation and TXT or ZIP export.'
  },
  {
    title: 'Images to GIF improvements',
    benefit:
      'Make GIF creation easier with drag-and-drop, flexible frame timing and clear processing feedback.'
  },
  {
    title: 'Audio/Video Trim Timeline',
    benefit:
      'Select and preview start and end points visually, with keyboard-accessible controls and precise time inputs.'
  },
  {
    title: 'Local PDF Form Builder',
    benefit:
      'Add named text fields and checkboxes to PDFs and export a fillable document without cloud saving.'
  },
  {
    title: 'OCR Table to CSV',
    benefit:
      'Extract a table from an image, correct rows and columns, and download CSV after reviewing the result.'
  },
  {
    title: 'Local MCP Companion',
    benefit:
      'Explore a separate local package that gives compatible MCP clients access to selected JSON and text tools.'
  }
] as const;

export const plannedFeatureSummary = (benefit: string, index: number) =>
  `Planned. Priority ${index + 1}. ${benefit}`;

export const roadmapSections = (): ContentSection[] => [
  {
    heading: ROADMAP_BACKLOG_HEADING,
    kind: 'list',
    items: [ROADMAP_BACKLOG_NOTICE, ROADMAP_FOUNDATION]
  },
  {
    heading: 'Proposed order',
    kind: 'examples',
    examples: PLANNED_FEATURES.map((feature, index) => ({
      title: feature.title,
      description: plannedFeatureSummary(feature.benefit, index)
    }))
  }
];

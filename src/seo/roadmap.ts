import type { ContentSection } from './types';

export const ROADMAP_BACKLOG_HEADING = 'Planned features';
export const ROADMAP_BACKLOG_NOTICE =
  'These milestones are planned or partial, not complete. Priority indicates the proposed order, not a release date. Development subscopes above do not imply production availability; scope and order may change after testing and feedback.';
export const ROADMAP_FOUNDATION =
  'Remaining foundation work includes PDF Editor save/share/retention auditing and clipboard checks in other input/file consumers. Bounded list regex execution is merged into develop; production rollout is separate.';
export const ROADMAP_BACKLOG_URL =
  'https://github.com/nguyenan97/orvulix-web/blob/develop/docs/FEATURE_BACKLOG.md';

// Verified against develop 2330dd67 and main 96494b8 on 2026-10-17.
// These changes are NOT released to main. Recheck Git ancestry when updating.
export const DEVELOPMENT_HEADING = 'Development updates';
export const DEVELOPMENT_NOTICE =
  'Merged into develop through PR #38, not released to production. This snapshot separates delivered development work from the planned features below. Website URL conversion remains paused.';
export const DEVELOPMENT_UPDATES = [
  {
    title: 'Bounded list regex execution',
    description:
      'Merged into develop in PR #19. All 11 regex-splitting list tools use bounded workers with timeout, cancellation and recovery.'
  },
  {
    title: 'Local HTML conversion',
    description:
      'Merged into develop in PR #20, with discovery corrections in PR #22. Experimental HTML upload/paste to PNG, JPEG and raster PDF; pagination, ranges, supported table headers and presets. PDF text is not searchable/selectable. URL conversion and custom fonts remain deferred.'
  },
  {
    title: 'PNG dimension preservation',
    description:
      'Merged into develop in PR #24. Native dimensions and non-inflation checks for existing PNG compression. This is not a lossless optimizer.'
  },
  {
    title: 'Bounded multi-file import',
    description:
      'Merged into develop in PR #25. Image, audio, video and PDF inputs support bounded picker/drop batches, ordering, rejection and cleanup. This does not complete every conversion consumer lifecycle.'
  },
  {
    title: 'GIF output reliability',
    description:
      'Merged into develop in PR #26 and PR #27. Stale-result prevention and bounded mixed PNG/JPEG normalization. Explicit Create, richer progress and quality work remain separate.'
  },
  {
    title: 'Merge PDF output ownership',
    description:
      'Merged into develop in PR #29. Clear, input edits and unmount invalidate old runs; page order and geometry are retained. Cancellation is cooperative, with input/page/output budgets.'
  },
  {
    title: 'Text-result clipboard reliability',
    description:
      'Merged into develop in PR #30. Copy matches displayed text, with manual-copy guidance when native clipboard access fails. Downloads retain raw data. Code-result delivery is recorded below; input/file follow-ups are separate.'
  },
  {
    title: 'Code-result clipboard reliability',
    description:
      'Merged into develop in PR #31. Formatted JSON and literal escapes are preserved during native copy and download. Unsupported code-result footer gestures show manual-copy guidance without a WebKit ancestor error. Input/file consumers and other editor gestures remain separate.'
  },
  {
    title: 'Input clipboard reliability',
    description:
      'Merged into develop in PR #32. Text/code input Copy retains source values and reports native clipboard failures. Code-input import and copy footers guard unsupported WebKit gestures. File/diff consumers and editor-wide handlers remain separate.'
  },
  {
    title: 'External PDF Editor opt-in',
    description:
      'Merged into develop in PR #33. SimplePDF loads only after explicit opt-in, with analytics/document-metadata disclosure. The live audit covers load/render; save/share and retention remain follow-ups.'
  },
  {
    title: 'Text and code file import ownership',
    description:
      'Merged into develop in PR #34, with size admission and delayed-commit fixes in PR #38. Old text-file reads cannot overwrite later edits, selections or resets. Read errors and same-file retry are handled. Other file consumers and clipboard intermittency remain follow-ups.'
  },
  {
    title: 'JSON Prettify result ownership',
    description:
      'Merged into develop in PR #35, with input/depth/token/output limits in PR #38. Empty or invalid source clears old output and disables result actions. Inline validation follows current source and indentation. Parsing is synchronous; larger-document worker isolation remains separate.'
  },
  {
    title: 'JSON Minify result ownership',
    description:
      'Merged into develop in PR #36, with input/depth/token/output limits in PR #38. Empty or invalid source clears old output and disables exports; inline errors follow current input. JSON/JSONL formats and extensions are preserved. Other tools and worker isolation remain separate.'
  },
  {
    title: 'JSON Sort current output and resource limits',
    description:
      'Merged into develop in PR #37 and PR #38. Sort retains own keys, derives results from current input/options and blocks stale exports. Shared Prettify/Minify/Sort budgets bound source, depth, tokens and serialized output; these are not a strict heap/time quota.'
  }
] as const;

// Public summaries of docs/FEATURE_BACKLOG.md, in the same proposed order.
// Keep this module React-free so prerender and UI use the same copy.
export const PLANNED_FEATURES: readonly {
  title: string;
  benefit: string;
  status?: string;
}[] = [
  {
    title: 'Text Workflow Builder',
    status: 'Text-only MVP implemented for development',
    benefit:
      'Six ordered transformations, intermediate previews and settings-only recipe import/export. Broader cross-tool and media workflows remain planned; production release is separate.'
  },
  {
    title: 'Docker Run to Compose',
    status: 'Bounded command converter implemented for development',
    benefit:
      'Turn common docker run options into Compose YAML, with warnings for unsupported options. Commands will not be executed.'
  },
  {
    title: 'File Checksum Calculator',
    status: 'Bounded local-file MVP implemented for development',
    benefit:
      'Calculate SHA-256 or SHA-512 for one local file up to 64 MiB, compare an expected checksum and copy the result. Larger streaming files and batch processing remain separate.'
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
      'Build on multi-file import and GIF reliability fixes in develop. Explicit Create, richer progress and further timing UX remain planned; quality optimization is separate.'
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

export const plannedFeatureSummary = (
  benefit: string,
  index: number,
  status = 'Planned'
) => `${status}. Priority ${index + 1}. ${benefit}`;

export const roadmapSections = (): ContentSection[] => [
  { heading: DEVELOPMENT_HEADING, kind: 'list', items: [DEVELOPMENT_NOTICE] },
  {
    heading: 'Delivered development scope',
    kind: 'examples',
    examples: [...DEVELOPMENT_UPDATES]
  },
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
      description: plannedFeatureSummary(feature.benefit, index, feature.status)
    }))
  }
];

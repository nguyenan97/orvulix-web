import type { ContentSection, ToolSeoOverride } from './types';

/**
 * Content sections shown under a tool. The same sections are rendered by the
 * React SeoContent component and by the build-time static HTML, so both
 * always carry identical text.
 */
export const buildToolSections = (
  toolName: string,
  override: ToolSeoOverride
): ContentSection[] => {
  const sections: ContentSection[] = [
    { heading: `How to use ${toolName}`, kind: 'steps', steps: override.howTo }
  ];
  if (override.examples?.length) {
    sections.push({
      heading: 'Examples',
      kind: 'examples',
      examples: override.examples
    });
  }
  if (override.notes.length) {
    sections.push({
      heading: 'Good to know',
      kind: 'list',
      items: override.notes
    });
  }
  if (override.faq?.length) {
    sections.push({
      heading: 'Frequently asked questions',
      kind: 'faq',
      faq: override.faq
    });
  }
  return sections;
};

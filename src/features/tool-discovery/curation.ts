type DiscoverableTool = { path: string; name: string };

const localHtmlPaths = new Set([
  'pdf/html-to-pdf',
  'image-generic/html-to-image'
]);

// Editorial examples, not a popularity ranking or registry insertion order.
const categoryExamples: Record<string, readonly string[]> = {
  pdf: ['pdf/split-pdf', 'pdf/merge-pdf'],
  'image-generic': ['image-generic/resize', 'image-generic/crop']
};

/** Preserve upstream order among existing tools and keep local HTML last. */
export function orderBrowseTools<T extends DiscoverableTool>(
  tools: readonly T[]
): T[] {
  return [
    ...tools.filter((tool) => !localHtmlPaths.has(tool.path)),
    ...tools.filter((tool) => localHtmlPaths.has(tool.path))
  ];
}

/** Select only from available/filtered tools; new upstream tools need no flags. */
export function categoryExample<T extends DiscoverableTool>(
  category: string,
  tools: readonly T[]
) {
  const preferred = categoryExamples[category]
    ?.map((path) => tools.find((tool) => tool.path === path))
    .find((tool) => tool !== undefined);
  const fallback = [...tools].sort(
    (a, b) =>
      Number(localHtmlPaths.has(a.path)) - Number(localHtmlPaths.has(b.path)) ||
      a.path.localeCompare(b.path, 'en')
  )[0];
  const selected = preferred ?? fallback;
  return selected
    ? { title: selected.name, path: selected.path }
    : { title: '', path: '' };
}

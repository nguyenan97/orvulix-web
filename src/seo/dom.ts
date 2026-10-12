import { MANAGED_HEAD_SELECTORS } from './head';
import type { HeadTag } from './types';

const signature = (tag: string, attrs: [string, string][], text: string) =>
  JSON.stringify([
    tag.toLowerCase(),
    [...attrs].sort(([a], [b]) => a.localeCompare(b)),
    text
  ]);

const elementSignature = (element: Element) =>
  signature(
    element.tagName,
    [...element.attributes].map((attr) => [attr.name, attr.value]),
    element.tagName === 'SCRIPT' ? element.textContent ?? '' : ''
  );

const tagSignature = (tag: HeadTag) =>
  signature(
    tag.tag,
    Object.entries(tag.attrs),
    tag.tag === 'script' ? tag.text ?? '' : ''
  );

/**
 * Makes the document head match `tags` exactly. Every element the SEO layer
 * owns (see MANAGED_HEAD_SELECTORS), including ones from the HTML template or
 * a previous route, is removed before the new tags are inserted, so no route
 * ever ends up with two canonicals, descriptions or JSON-LD blocks. When the
 * head already matches (direct load of a prerendered page) nothing changes.
 */
export const applyHeadTags = (
  doc: Document,
  tags: HeadTag[],
  language: string
): void => {
  const title = tags.find((tag) => tag.tag === 'title')?.text ?? '';
  if (doc.title !== title) doc.title = title;
  if (doc.documentElement.lang !== language)
    doc.documentElement.lang = language;

  const current = [
    ...doc.head.querySelectorAll(MANAGED_HEAD_SELECTORS.join(','))
  ];
  const wanted = tags.filter((tag) => tag.tag !== 'title');
  const currentSignatures = current.map(elementSignature).sort();
  const wantedSignatures = wanted.map(tagSignature).sort();
  if (
    currentSignatures.length === wantedSignatures.length &&
    currentSignatures.every((value, index) => value === wantedSignatures[index])
  ) {
    return;
  }

  current.forEach((element) => element.remove());
  for (const tag of wanted) {
    const element = doc.createElement(tag.tag);
    for (const [name, value] of Object.entries(tag.attrs)) {
      element.setAttribute(name, value);
    }
    if (tag.text !== undefined) element.textContent = tag.text;
    doc.head.appendChild(element);
  }
};

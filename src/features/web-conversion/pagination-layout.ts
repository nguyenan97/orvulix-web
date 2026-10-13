import { frameDocument, type PreparedHtml } from './sanitize';
import {
  type DocumentLayout,
  type ProtectedBlock,
  PAGINATION_LIMITS
} from './pagination';

/** Trusted wrapper: flow-root makes margins identical in measurement and clones. */
export function paginatedDocument(prepared: PreparedHtml, offset = 0) {
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > PAGINATION_LIMITS.documentHeight
  )
    throw Error('Invalid page source offset.');
  return frameDocument({
    ...prepared,
    markup: `<div data-page-source style="display:flow-root;transform:translateY(-${offset}px)">${prepared.markup}</div>`
  });
}
export function measureDocument(
  root: HTMLElement,
  width: number
): DocumentLayout {
  const win = root.ownerDocument.defaultView;
  if (!win) throw Error('Measurement frame is unavailable.');
  const origin = root.getBoundingClientRect();
  const blocks: ProtectedBlock[] = [];
  let height = 0,
    extent = 0;
  const elements = [...root.querySelectorAll<HTMLElement>('*')];
  if (elements.length > 1000) throw Error('Too many measured elements.');
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const top = rect.top - origin.top,
      bottom = rect.bottom - origin.top;
    if (!Number.isFinite(top) || top < 0 || !Number.isFinite(bottom))
      throw Error('Unsupported source geometry.');
    extent = Math.max(extent, bottom, top + element.scrollHeight);
    if (
      rect.right - origin.left > width + 0.5 ||
      element.scrollWidth > rect.width + 0.5
    )
      throw Error(
        'Content exceeds the page width. Reduce fixed widths or use One page.'
      );
    const style = win.getComputedStyle(element);
    const row = element.localName === 'tr';
    // Preserve whole rows. Rowspan tables and nested tables are atomic, not
    // independently breakable. Simple wrappers may contain multiple leaf blocks.
    const atomicTable =
      element.localName === 'table' &&
      !!element.querySelector('table, [rowspan]:not([rowspan="1"])');
    const leaf = !element.querySelector(
      'div,p,h1,h2,h3,h4,h5,h6,li,pre,blockquote,table,tr'
    );
    const ownText = [...element.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent?.trim()
    );
    const painted =
      !!style.backgroundColor &&
      style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
      style.backgroundColor !== 'transparent';
    const visible =
      !!element.textContent?.trim() ||
      element.localName === 'img' ||
      painted ||
      element.localName === 'hr';
    if (visible && (leaf || ownText || row || atomicTable || painted))
      height = Math.max(height, bottom);
    if (
      row ||
      atomicTable ||
      (visible && (leaf || ownText) && !element.closest('tr'))
    ) {
      blocks.push({ top, bottom, kind: row ? 'row' : 'block' });
    }
  }
  // Anonymous top-level text is atomic. Use its actual line bounds instead of
  // ignoring it or pretending it has no printable content.
  for (const node of [...root.childNodes]) {
    if (node.nodeType !== 3 || !node.textContent?.trim()) continue;
    const range = root.ownerDocument.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    const top = rect.top - origin.top,
      bottom = rect.bottom - origin.top;
    if (rect.height) {
      blocks.push({ top, bottom, kind: 'block' });
      height = Math.max(height, bottom);
    }
  }
  extent = Math.max(extent, height, root.scrollHeight);
  return { height, extent, blocks };
}

import DOMPurify from 'dompurify';
import { LIMITS, validateInput } from './model';
import {
  readEmbeddedImage,
  checkAssetTotals,
  type EmbeddedImage
} from './assets';

const tags = [
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'pre',
  'code',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'img'
];
const enums: Record<string, readonly string[]> = {
  display: [
    'block',
    'inline',
    'inline-block',
    'flex',
    'table',
    'table-row',
    'table-cell',
    'none'
  ],
  'font-weight': ['normal', 'bold', '400', '500', '600', '700'],
  'font-style': ['normal', 'italic'],
  'text-align': ['left', 'center', 'right'],
  'white-space': ['normal', 'pre', 'pre-wrap'],
  'border-collapse': ['collapse', 'separate'],
  'flex-direction': ['row', 'column'],
  'justify-content': ['flex-start', 'center', 'flex-end', 'space-between'],
  'align-items': ['stretch', 'flex-start', 'center', 'flex-end'],
  'font-family': ['Arial', 'sans-serif', 'serif', 'monospace']
};
function allowedStyle(property: string, value: string) {
  if (enums[property]?.includes(value)) return true;
  if (['color', 'background-color', 'border-color'].includes(property))
    return /^(#[a-f0-9]{3,8}|[a-z]{1,20}|rgba?\([\d.,%\s]{1,50}\))$/i.test(
      value
    );
  if (
    /^(margin|padding)(-(top|right|bottom|left))?$/.test(property) ||
    property === 'gap'
  )
    return (
      value.split(/\s+/).length <= 4 &&
      value.split(/\s+/).every((v) => /^(0|\d{1,2}px)$/.test(v))
    );
  if (property === 'font-size')
    return (
      /^\d{1,2}px$/.test(value) &&
      parseFloat(value) >= 8 &&
      parseFloat(value) <= 72
    );
  if (['width', 'max-width'].includes(property))
    return (
      /^(\d{1,4}px|\d{1,3}%)$/.test(value) &&
      parseFloat(value) <= (value.endsWith('%') ? 100 : 1280)
    );
  if (['height', 'max-height'].includes(property))
    return /^\d{1,4}px$/.test(value) && parseFloat(value) <= 1080;
  if (property === 'border')
    return /^\dpx (solid|dashed|dotted) (#[a-f0-9]{3,8}|[a-z]{1,20})$/i.test(
      value
    );
  if (property === 'border-radius') return /^\d{1,2}px$/.test(value);
  return false;
}
export interface PreparedHtml {
  markup: string;
  notices: string[];
  assets: EmbeddedImage[];
}
/** Only inert text/table markup and a small, network-free inline CSS subset. */
export function prepareHtml(input: string): PreparedHtml {
  validateInput(input);
  // Raw markup lives only in a detached, inert template. Rebuild the allowed
  // subset before DOMPurify imports anything into another document.
  const template = document.createElement('template');
  template.innerHTML = input;
  const notices = new Set<string>();
  const assets: EmbeddedImage[] = [];
  const container = document.createElement('div');
  let count = 0;
  const copy = (node: Node, target: Node, depth: number) => {
    if (++count > LIMITS.nodes || depth > LIMITS.depth)
      throw Error('HTML exceeds the 1000 node or 24 level limit.');
    if (node.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(node.textContent || ''));
      return;
    }
    if (!(node instanceof Element)) return;
    if (
      !tags.includes(node.localName) ||
      node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
    ) {
      notices.add('Unsupported markup, scripts or attributes were removed.');
      // Preserve text from ordinary link/structural wrappers, never active content.
      if (
        [
          'html',
          'body',
          'a',
          'section',
          'article',
          'main',
          'header',
          'footer'
        ].includes(node.localName)
      )
        for (const child of Array.from(node.childNodes))
          copy(child, target, depth + 1);
      return;
    }
    const image =
      node.localName === 'img'
        ? readEmbeddedImage(node.getAttribute('src') || '')
        : null;
    if (node.localName === 'img' && !image) {
      notices.add(
        'External, SVG and unsupported images were removed. Embed PNG/JPEG using base64 data URLs.'
      );
      return;
    }
    if (image) {
      assets.push(image);
      checkAssetTotals(assets);
    }
    const safeNode = document.createElement(node.localName);
    if (image) {
      safeNode.setAttribute('src', image.dataUrl);
      safeNode.setAttribute(
        'alt',
        (node.getAttribute('alt') || 'Embedded image').slice(0, 160)
      );
      for (const key of ['width', 'height']) {
        const value = Number(node.getAttribute(key));
        if (Number.isInteger(value) && value > 0 && value <= 1280)
          safeNode.setAttribute(key, String(value));
      }
    }
    const attributes = image
      ? ['style', 'src', 'alt', 'width', 'height']
      : ['style', 'colspan', 'rowspan'];
    if (
      Array.from(node.attributes).some(
        (attr) => !attributes.includes(attr.name)
      )
    )
      notices.add('Unsupported markup, scripts or attributes were removed.');
    const raw = node.getAttribute('style');
    if (raw) {
      const parsed = document.createElement('div').style;
      parsed.cssText = raw;
      const safe = safeNode.style;
      for (const property of Array.from(parsed)) {
        const value = parsed.getPropertyValue(property).trim();
        if (allowedStyle(property, value)) safe.setProperty(property, value);
        else
          notices.add(
            'Unsupported inline styles were removed. Use simple colors, typography, spacing and tables.'
          );
      }
    }
    for (const key of ['colspan', 'rowspan'])
      if (node.hasAttribute(key)) {
        const value = Number(node.getAttribute(key));
        if (Number.isInteger(value) && value >= 1 && value <= 20)
          safeNode.setAttribute(key, String(value));
      }
    target.appendChild(safeNode);
    for (const child of Array.from(node.childNodes))
      copy(child, safeNode, depth + 1);
  };
  for (const node of Array.from(template.content.childNodes))
    copy(node, container, 1);
  if (!container.textContent?.trim() && !assets.length)
    throw Error(
      'No supported content remains. Use text, lists, tables or embedded PNG/JPEG images.'
    );
  const markup = DOMPurify.sanitize(container.innerHTML, {
    ALLOWED_TAGS: tags,
    ALLOWED_ATTR: [
      'style',
      'colspan',
      'rowspan',
      'src',
      'alt',
      'width',
      'height'
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false
  });
  if (!markup) throw Error('The browser could not safely parse this HTML.');
  return { markup, notices: [...notices], assets };
}
export function frameDocument(prepared: PreparedHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;color:#111827;background:transparent;font:16px Arial,sans-serif}body{overflow:hidden;overflow-wrap:anywhere}*,*::before,*::after{box-sizing:border-box}table{border-collapse:collapse;max-width:100%}th,td{padding:8px;border:1px solid #d1d5db}pre{white-space:pre-wrap}img{max-width:100%;max-height:1080px}</style></head><body>${prepared.markup}</body></html>`;
}

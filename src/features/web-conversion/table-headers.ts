import { HEADER_LIMITS, type TableHeader } from './table-header-model';
import type { PageSlice, PaginationPlan } from './pagination';

const unsupported = () =>
  Error(
    'Repeat table headers supports normal-flow tables with thead and body cells without spans. Remove nested tables, rowspan, caption/tfoot or layout overrides, or turn this option off.'
  );
const inherited = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'color',
  'text-align',
  'border-collapse',
  'border-spacing'
] as const;
/** Only clones a sanitized header, never the complete source table/body. */
export function cloneHeader(source: HTMLTableElement, model: TableHeader) {
  const doc = source.ownerDocument,
    win = doc.defaultView;
  const head = source.querySelector(':scope > thead');
  if (!win || !head) throw unsupported();
  const copy = source.cloneNode(false) as HTMLTableElement;
  copy.removeAttribute('id');
  const computed = win.getComputedStyle(source);
  for (const key of inherited)
    copy.style.setProperty(key, computed.getPropertyValue(key));
  Object.assign(copy.style, {
    width: `${model.width}px`,
    maxWidth: 'none',
    tableLayout: 'fixed',
    margin: '0',
    position: 'static',
    transform: 'none'
  });
  // Keep the table's painted ancestor background behind transparent header cells.
  for (let el: Element | null = source; el; el = el.parentElement) {
    const color = win.getComputedStyle(el).backgroundColor;
    if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
      copy.style.backgroundColor = color;
      break;
    }
  }
  const cols = doc.createElement('colgroup');
  for (const width of model.columns) {
    const col = doc.createElement('col');
    col.style.width = `${width}px`;
    cols.append(col);
  }
  copy.append(cols, head.cloneNode(true));
  return copy;
}
async function imagesReady(root: Element) {
  await Promise.all(
    [...root.querySelectorAll('img')].map((img) => img.decode())
  );
}
/** Measurements and the probe live inside the owned, script-disabled source frame. */
export async function measureTableHeaders(
  root: HTMLElement,
  check: () => void
): Promise<TableHeader[]> {
  const win = root.ownerDocument.defaultView;
  if (!win) throw Error('Header measurement frame is unavailable.');
  const origin = root.getBoundingClientRect(),
    result: TableHeader[] = [];
  for (const [index, table] of [...root.querySelectorAll('table')].entries()) {
    check();
    const box = table.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    if (table.querySelector('table') || table.parentElement?.closest('table'))
      throw unsupported();
    if (!table.tHead) continue; // Never guess a first body row as a header.
    if (
      table.caption ||
      table.tFoot ||
      table.querySelector('[rowspan]:not([rowspan="1"])')
    )
      throw unsupported();
    for (
      let el: Element | null = table.parentElement;
      el && el !== root;
      el = el.parentElement
    ) {
      if (
        !['block', 'flow-root', 'list-item'].includes(
          win.getComputedStyle(el).display
        )
      )
        throw unsupported();
    }
    if (win.getComputedStyle(table).display !== 'table') throw unsupported();
    const head = table.tHead,
      headBox = head.getBoundingClientRect();
    if (
      win.getComputedStyle(head).display !== 'table-header-group' ||
      [...table.tBodies].some(
        (body) => win.getComputedStyle(body).display !== 'table-row-group'
      )
    )
      throw unsupported();
    const bodyRows = [...table.tBodies]
      .flatMap((body) => [...body.rows])
      .filter((row) => row.getBoundingClientRect().height > 0);
    if (!bodyRows.length) continue;
    if (
      !headBox.height ||
      !head.rows.length ||
      head.querySelectorAll('*').length > HEADER_LIMITS.nodes
    )
      throw unsupported();
    const first = bodyRows[0];
    if (!first.cells.length || first.cells.length > HEADER_LIMITS.columns)
      throw unsupported();
    const columns = [...first.cells].map(
      (cell) => cell.getBoundingClientRect().width
    );
    for (const row of [...head.rows, ...bodyRows]) {
      if (
        win.getComputedStyle(row).display !== 'table-row' ||
        [...row.cells].some(
          (cell) => win.getComputedStyle(cell).display !== 'table-cell'
        )
      )
        throw unsupported();
      const spans = [...row.cells].reduce((n, cell) => n + cell.colSpan, 0);
      if (
        spans !== columns.length ||
        (row.parentElement !== head &&
          [...row.cells].some((cell) => cell.colSpan !== 1))
      )
        throw unsupported();
    }
    const model: TableHeader = {
      index,
      top: box.top - origin.top,
      bottom: box.bottom - origin.top,
      headBottom: headBox.bottom - origin.top,
      left: box.left - origin.left,
      width: box.width,
      height: 1,
      columns,
      rows: bodyRows.map((row) => {
        const r = row.getBoundingClientRect();
        return {
          top: r.top - origin.top,
          bottom: r.bottom - origin.top,
          kind: 'row'
        };
      })
    };
    const holder = root.ownerDocument.createElement('div');
    Object.assign(holder.style, {
      position: 'absolute',
      left: '-10000px',
      top: '0',
      width: `${origin.width}px`
    });
    const clone = cloneHeader(table, model);
    holder.append(clone);
    root.ownerDocument.body.append(holder);
    try {
      await imagesReady(clone);
      check();
      const cloneBox = clone.getBoundingClientRect(),
        cloneHead = clone.tHead!.getBoundingClientRect();
      const originals = [...head.querySelectorAll('th,td')],
        copies = [...clone.tHead!.querySelectorAll('th,td')];
      if (
        Math.abs(cloneHead.height - headBox.height) > 0.5 ||
        originals.length !== copies.length ||
        originals.some((cell, i) => {
          const a = cell.getBoundingClientRect(),
            b = copies[i].getBoundingClientRect();
          return (
            Math.abs(a.width - b.width) > 0.5 ||
            Math.abs(a.left - box.left - (b.left - cloneBox.left)) > 0.5 ||
            Math.abs(a.height - b.height) > 0.5
          );
        })
      )
        throw Error(
          'Repeated header changed column widths or wrapping. Simplify the table or turn Repeat table headers off.'
        );
      model.height = Math.ceil(cloneBox.height);
      result.push(model);
      if (result.length > HEADER_LIMITS.tables) throw unsupported();
    } finally {
      holder.remove();
    }
  }
  return result;
}
/** Same source clip and bounded header clone in preview and export. */
export async function composeHeaderPage(
  body: HTMLElement,
  plan: PaginationPlan,
  slice: PageSlice,
  check: () => void = () => {}
) {
  check();
  const source = body.querySelector<HTMLElement>('[data-page-source]');
  if (!source) throw Error('Page source is unavailable.');
  // Restore the original root before removing the last page's temporary wrappers.
  body.append(source);
  body.querySelector('[data-page-clip]')?.remove();
  body.querySelector('[data-repeated-header]')?.remove();
  const reserve = slice.header?.height ?? 0;
  const clip = body.ownerDocument.createElement('div');
  clip.dataset.pageClip = 'true';
  Object.assign(clip.style, {
    position: 'absolute',
    left: '0',
    top: `${reserve}px`,
    width: `${plan.width}px`,
    height: `${slice.end - slice.start}px`,
    overflow: 'hidden'
  });
  source.style.transform = `translateY(-${slice.start}px)`;
  clip.append(source);
  body.append(clip);
  if (!slice.header) return;
  const model = plan.tables?.find((t) => t.index === slice.header!.table);
  const table = source.querySelectorAll('table')[slice.header.table];
  if (!model || !table || model.height !== reserve)
    throw Error('Repeated header plan is unavailable.');
  const holder = body.ownerDocument.createElement('div');
  holder.dataset.repeatedHeader = 'true';
  Object.assign(holder.style, {
    position: 'absolute',
    left: `${model.left}px`,
    top: '0',
    width: `${model.width}px`,
    height: `${reserve}px`,
    overflow: 'hidden'
  });
  const clone = cloneHeader(table, model);
  holder.append(clone);
  body.append(holder);
  await imagesReady(clone);
  check();
  if (Math.abs(Math.ceil(clone.getBoundingClientRect().height) - reserve) > 0)
    throw Error(
      'Repeated header layout changed. Preview again before exporting.'
    );
}

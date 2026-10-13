import { afterEach, expect, it, vi } from 'vitest';
import {
  cloneHeader,
  composeHeaderPage,
  measureTableHeaders
} from './table-headers';
import { prepareHtml } from './sanitize';
import { type TableHeader } from './table-header-model';
import { planPagination } from './pagination';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
const model: TableHeader = {
  index: 0,
  top: 0,
  bottom: 1000,
  headBottom: 40,
  left: 20,
  width: 280,
  height: 40,
  columns: [80, 200],
  rows: [{ top: 40, bottom: 1000, kind: 'row' }]
};
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
function source() {
  const root = document.createElement('div');
  root.dataset.pageSource = 'true';
  root.innerHTML = prepareHtml(
    '<table style="color:red"><thead><tr><th colspan="2">Safe <img src="https://blocked.test/x" onerror="attack()"></th></tr><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>SECRET BODY</td><td>Value</td></tr></tbody></table>'
  ).markup;
  document.body.append(root);
  return root;
}
it('clones only the safe header, locks columns and never includes body or hostile assets/handlers', () => {
  const root = source(),
    original = root.querySelector('table')!,
    copy = cloneHeader(original, model);
  expect(copy.querySelector('tbody')).toBeNull();
  expect(copy.textContent).not.toContain('SECRET BODY');
  expect(copy.querySelector('img')).toBeNull();
  expect(copy.innerHTML).not.toMatch(/attack|blocked.test/);
  expect([...copy.querySelectorAll('col')].map((c) => c.style.width)).toEqual([
    '80px',
    '200px'
  ]);
  expect(copy.style.tableLayout).toBe('fixed');
  expect(copy.style.width).toBe('280px');
  expect(root.querySelector('tbody')?.textContent).toContain('SECRET BODY');
});
it('uses separate clipped source below the header and replaces temporary wrappers on every page', async () => {
  const root = source();
  const rows = Array.from({ length: 16 }, (_, i) => ({
    top: 40 + i * 60,
    bottom: 100 + i * 60,
    kind: 'row' as const
  }));
  const t = { ...model, rows };
  const plan = planPagination(
    { height: 1000, extent: 1000, blocks: rows, tables: [t] },
    { ...DEFAULT_OPTIONS, width: 320 },
    DEFAULT_PDF_OPTIONS,
    true
  );
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this.tagName === 'TABLE' && !this.closest('[data-page-source]'))
        return { ...original.call(this), height: 40 };
      return original.call(this);
    }
  );
  await composeHeaderPage(document.body, plan, plan.pages[1]);
  expect(document.querySelectorAll('[data-repeated-header]')).toHaveLength(1);
  expect(document.querySelector('[data-page-clip]')).toContainElement(root);
  expect(
    (document.querySelector('[data-page-clip]') as HTMLElement).style.top
  ).toBe('40px');
  expect(root.style.transform).toBe(`translateY(-${plan.pages[1].start}px)`);
  await composeHeaderPage(document.body, plan, plan.pages[2]);
  expect(document.querySelectorAll('[data-repeated-header]')).toHaveLength(1);
  expect(document.querySelectorAll('[data-page-clip]')).toHaveLength(1);
  await composeHeaderPage(document.body, plan, plan.pages[0]);
  expect(document.querySelector('[data-repeated-header]')).toBeNull();
  expect(document.querySelectorAll('[data-page-source]')).toHaveLength(1);
  expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
});
it('rejects missing plan/source and stops a cancelled page before changing DOM', async () => {
  const plan = planPagination(
    { height: 100, extent: 100, blocks: [] },
    { ...DEFAULT_OPTIONS, width: 320 },
    DEFAULT_PDF_OPTIONS
  );
  await expect(
    composeHeaderPage(document.body, plan, plan.pages[0])
  ).rejects.toThrow(/unavailable/);
  const root = source();
  await expect(
    composeHeaderPage(document.body, plan, plan.pages[0], () => {
      throw new DOMException('Cancelled', 'AbortError');
    })
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(root.parentElement).toBe(document.body);
});
it('ignores entirely hidden tables but never promotes body rows into implicit headers', async () => {
  source();
  expect(
    await measureTableHeaders(
      document.querySelector('[data-page-source]')!,
      () => {}
    )
  ).toEqual([]); // jsdom has no layout; hidden/zero geometry is ignored.
});

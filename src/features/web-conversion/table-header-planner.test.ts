import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
import { planPagination, type DocumentLayout } from './pagination';
import { rasterHeight, type TableHeader } from './table-header-model';
const image = { ...DEFAULT_OPTIONS, width: 320 };
function table(top = 0, count = 18, index = 0): TableHeader {
  return {
    index,
    top,
    bottom: top + 60 + count * 60,
    headBottom: top + 60,
    left: 0,
    width: 320,
    height: 60,
    columns: [80, 240],
    rows: Array.from({ length: count }, (_, i) => ({
      top: top + 60 + i * 60,
      bottom: top + 120 + i * 60,
      kind: 'row' as const
    }))
  };
}
function layout(tables = [table()], tail = 0): DocumentLayout {
  const height = tables[tables.length - 1].bottom + tail;
  return {
    height,
    extent: height,
    blocks: tables.flatMap((t) => [
      { top: t.top, bottom: t.headBottom, kind: 'row' as const },
      ...t.rows
    ]),
    tables
  };
}
describe('header-aware page plans', () => {
  it('reserves header capacity without gaps, duplicates or blank trailing pages; Off remains unchanged', () => {
    const source = layout(),
      plain = planPagination(source, image, DEFAULT_PDF_OPTIONS),
      repeated = planPagination(source, image, DEFAULT_PDF_OPTIONS, true);
    expect(plain.tables).toBeUndefined();
    expect(plain.pages.every((p) => !p.header)).toBe(true);
    expect(repeated.pages.length).toBeGreaterThan(2);
    expect(repeated.pages[0].header).toBeUndefined();
    expect(repeated.pages.slice(1).every((p) => p.header?.height === 60)).toBe(
      true
    );
    expect(repeated.pages.reduce((n, p) => n + p.end - p.start, 0)).toBe(
      source.height
    );
    repeated.pages.forEach((p, i) => {
      expect(rasterHeight(p)).toBeLessThanOrEqual(repeated.capacity);
      if (i) expect(p.start).toBe(repeated.pages[i - 1].end);
    });
    for (const row of source.tables![0].rows)
      expect(
        repeated.pages.filter((p) => row.top >= p.start && row.bottom <= p.end)
      ).toHaveLength(1);
  });
  it('keeps original header with first body row and repeats only the continuing table, not following paragraphs', () => {
    const first = table(0, 8),
      second = table(first.bottom + 100, 8, 1),
      source = layout([first, second], 300);
    const result = planPagination(source, image, DEFAULT_PDF_OPTIONS, true);
    for (const t of [first, second]) {
      expect(
        result.pages.some((p) => p.start <= t.top && p.end >= t.rows[0].bottom)
      ).toBe(true);
      result.pages
        .filter((p) => p.header?.table === t.index)
        .forEach((p) => expect(p.start).toBeLessThan(t.bottom));
    }
    expect(result.pages[result.pages.length - 1].header).toBeUndefined();
  });
  it('handles half-pixel collapsed row edges without accepting real overlap or changing accepted fractional plans', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      top: 0.5 + i * 60,
      bottom: 0.5 + (i + 1) * 60,
      kind: 'row' as const
    }));
    const result = planPagination(
      { height: 1201, extent: 1201, blocks: rows },
      image,
      DEFAULT_PDF_OPTIONS
    );
    expect(result.pages[0].end).toBe(420);
    expect(result.pages.reduce((n, p) => n + p.end - p.start, 0)).toBe(1201);
    expect(() =>
      planPagination(
        {
          height: 700,
          extent: 700,
          blocks: [
            { top: 0, bottom: 460, kind: 'block' },
            { top: 450, bottom: 600, kind: 'row' }
          ]
        },
        image,
        DEFAULT_PDF_OPTIONS
      )
    ).toThrow(/Overlapping/);
  });
  for (const paper of ['a4', 'letter'] as const)
    for (const orientation of ['portrait', 'landscape'] as const)
      it(`${paper}/${orientation}: scale invariance and asymmetric margins`, () => {
        const pdf = {
          ...DEFAULT_PDF_OPTIONS,
          paper,
          orientation,
          margins: { top: 12, bottom: 25, left: 5, right: 20 }
        };
        const a = planPagination(layout([table(0, 8)]), image, pdf, true),
          b = planPagination(
            layout([table(0, 8)]),
            { ...image, scale: 2 },
            pdf,
            true
          );
        expect(a.pages).toEqual(b.pages);
        expect(a.x).toBe(5);
        expect(a.y).toBe(12);
      });
  it('rejects header+row overflow, invalid geometry, table/column limits and cumulative repeated pixels', () => {
    const source = layout();
    source.tables![0].height = 450;
    expect(() =>
      planPagination(source, image, DEFAULT_PDF_OPTIONS, true)
    ).toThrow(/header and a body row/);
    for (const value of [NaN, Infinity, -1, 0]) {
      const data = layout();
      data.tables![0].width = value;
      expect(() =>
        planPagination(data, image, DEFAULT_PDF_OPTIONS, true)
      ).toThrow(/header geometry/);
    }
    const columns = layout();
    columns.tables![0].columns = Array(21).fill(320 / 21);
    expect(() =>
      planPagination(columns, image, DEFAULT_PDF_OPTIONS, true)
    ).toThrow();
    const duplicates = layout([table(), table(1140, 1, 0)]);
    expect(() =>
      planPagination(duplicates, image, DEFAULT_PDF_OPTIONS, true)
    ).toThrow();
    const t = table(0, 80);
    t.height = 200;
    t.headBottom = 200;
    t.rows = t.rows.map((r) => ({
      ...r,
      top: r.top + 140,
      bottom: r.bottom + 140
    }));
    t.bottom += 140;
    t.width = 800;
    t.columns = [200, 600];
    const raster = { ...image, width: 800, scale: 2 };
    // Source alone is exactly 16 MP; additional header strips exceed it.
    expect(() =>
      planPagination(layout([t]), raster, DEFAULT_PDF_OPTIONS)
    ).not.toThrow();
    expect(() =>
      planPagination(layout([t]), raster, DEFAULT_PDF_OPTIONS, true)
    ).toThrow(/16 MP/);
  });
});

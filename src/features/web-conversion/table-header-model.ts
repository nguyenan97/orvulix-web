import type { ProtectedBlock } from './pagination';

export const HEADER_LIMITS = { tables: 20, columns: 20, nodes: 128 } as const;
export interface TableHeader {
  index: number;
  top: number;
  bottom: number;
  headBottom: number;
  left: number;
  width: number;
  height: number;
  columns: number[];
  rows: ProtectedBlock[];
}
export interface RepeatedHeader {
  table: number;
  height: number;
}
export function validateTableHeaders(
  tables: TableHeader[],
  width: number,
  height: number
) {
  if (tables.length > HEADER_LIMITS.tables)
    throw Error('Too many repeated table headers (maximum 20).');
  let previous = 0;
  const ids = new Set<number>();
  let rowCount = 0;
  for (const table of tables) {
    if (
      !Number.isInteger(table.index) ||
      table.index < 0 ||
      table.index >= 1000 ||
      ids.has(table.index) ||
      ![
        table.top,
        table.bottom,
        table.headBottom,
        table.left,
        table.width,
        table.height
      ].every(Number.isFinite) ||
      table.top < previous ||
      table.bottom <= table.top ||
      table.bottom > height ||
      table.headBottom <= table.top ||
      table.headBottom >= table.bottom ||
      table.left < 0 ||
      table.width <= 0 ||
      table.left + table.width > width + 0.5 ||
      !Number.isInteger(table.height) ||
      table.height < 1 ||
      !table.columns.length ||
      table.columns.length > HEADER_LIMITS.columns ||
      table.columns.some((c) => !Number.isFinite(c) || c <= 0) ||
      table.columns.reduce((a, b) => a + b, 0) > table.width + 0.5 ||
      !table.rows.length ||
      table.rows.length > 1000
    )
      throw Error('Invalid repeated header geometry.');
    rowCount += table.rows.length;
    if (rowCount > 1000) throw Error('Too many measured table rows.');
    let rowEnd = table.headBottom;
    for (const row of table.rows) {
      if (
        row.kind !== 'row' ||
        !Number.isFinite(row.top) ||
        !Number.isFinite(row.bottom) ||
        row.top < rowEnd - 0.5 ||
        row.bottom <= row.top ||
        row.bottom > table.bottom
      )
        throw Error('Invalid table row geometry.');
      rowEnd = row.bottom;
    }
    ids.add(table.index);
    previous = table.bottom;
  }
}
export function rasterHeight(slice: {
  start: number;
  end: number;
  header?: RepeatedHeader;
}) {
  return slice.end - slice.start + (slice.header?.height ?? 0);
}

import { describe, expect, it } from 'vitest';
import {
  estimateTransfer,
  formatDuration,
  formatNumber,
  UNITS,
  type TransferInput
} from './model';
const input: TransferInput = {
  size: '1',
  sizeUnit: 'GB',
  rate: '100',
  rateUnit: 'Mb',
  efficiency: ''
};
describe('transfer estimates', () => {
  it('converts decimal bytes to bit rate', () => {
    expect(estimateTransfer(input)).toEqual({
      kind: 'success',
      seconds: 80,
      effectiveBitsPerSecond: 100_000_000
    });
  });
  it('applies user efficiency to the nominal transfer rate', () => {
    expect(estimateTransfer({ ...input, efficiency: '80' })).toEqual({
      kind: 'success',
      seconds: 100,
      effectiveBitsPerSecond: 80_000_000
    });
  });
  it.each([
    ['GiB', 'MiB', 10.24],
    ['GiB', 'MB', 10.73741824],
    ['GB', 'MB', 10],
    ['B', 'b', 0.08],
    ['b', 'B', 0.00125]
  ])('distinguishes size %s from rate %s/s', (sizeUnit, rateUnit, seconds) => {
    const result = estimateTransfer({ ...input, sizeUnit, rateUnit });
    expect(result.kind).toBe('success');
    if (result.kind === 'success')
      expect(result.seconds).toBeCloseTo(seconds, 10);
  });
  it('keeps every supported unit factor literal and case sensitive', () => {
    expect(UNITS.map(({ symbol, bits }) => [symbol, bits])).toEqual([
      ['b', 1],
      ['B', 8],
      ['kb', 1000],
      ['kB', 8000],
      ['Mb', 1000000],
      ['MB', 8000000],
      ['Gb', 1000000000],
      ['GB', 8000000000],
      ['Tb', 1000000000000],
      ['TB', 8000000000000],
      ['Kib', 1024],
      ['KiB', 8192],
      ['Mib', 1048576],
      ['MiB', 8388608],
      ['Gib', 1073741824],
      ['GiB', 8589934592],
      ['Tib', 1099511627776],
      ['TiB', 8796093022208]
    ]);
    expect(estimateTransfer({ ...input, sizeUnit: 'gb' }).kind).toBe('error');
    expect(estimateTransfer({ ...input, rateUnit: '__proto__' }).kind).toBe(
      'error'
    );
  });
  it('handles zero size, incomplete input and optional efficiency', () => {
    expect(estimateTransfer({ ...input, size: '0' })).toMatchObject({
      kind: 'success',
      seconds: 0
    });
    expect(estimateTransfer({ ...input, size: '' })).toEqual({
      kind: 'incomplete'
    });
    expect(estimateTransfer({ ...input, rate: ' ' })).toEqual({
      kind: 'incomplete'
    });
    expect(
      estimateTransfer({ ...input, size: ' 01. ', efficiency: '  ' })
    ).toMatchObject({ kind: 'success', seconds: 80 });
    expect(estimateTransfer({ ...input, size: '.5' })).toMatchObject({
      kind: 'success',
      seconds: 40
    });
  });
  it.each([
    '-1',
    '+1',
    'Infinity',
    'NaN',
    '1e3',
    '0x10',
    '1,000',
    '12MB',
    '.',
    '1.2.3',
    '9'.repeat(33),
    '1000000000000001'
  ])('rejects malformed or out-of-bound size %s', (size) => {
    expect(estimateTransfer({ ...input, size })).toMatchObject({
      kind: 'error',
      field: 'size'
    });
  });
  it.each(['0', '-0', '-1', '101', 'Infinity', 'NaN', '1e2'])(
    'rejects invalid efficiency %s',
    (efficiency) => {
      expect(estimateTransfer({ ...input, efficiency })).toMatchObject({
        kind: 'error',
        field: 'efficiency'
      });
    }
  );
  it('rejects a zero rate and validates filled fields while others are empty', () => {
    expect(estimateTransfer({ ...input, rate: '0' })).toMatchObject({
      kind: 'error',
      field: 'rate'
    });
    expect(
      estimateTransfer({ ...input, size: '', rate: 'oops' })
    ).toMatchObject({ kind: 'error', field: 'rate' });
    expect(
      estimateTransfer({ ...input, size: '', efficiency: '0' })
    ).toMatchObject({ kind: 'error', field: 'efficiency' });
  });
  it('enforces the character limit before trimming even optional whitespace', () => {
    expect(
      estimateTransfer({ ...input, efficiency: ' '.repeat(33) })
    ).toMatchObject({ kind: 'error', field: 'efficiency' });
  });
  it('admits maximum scalar values and rejects unrepresentable whole-second durations', () => {
    expect(
      estimateTransfer({
        ...input,
        size: '1000000000000000',
        rate: '1000000000000000',
        sizeUnit: 'B',
        rateUnit: 'B'
      })
    ).toMatchObject({ kind: 'success', seconds: 1 });
    expect(
      estimateTransfer({
        ...input,
        size: '1000000000000000',
        sizeUnit: 'TiB',
        rate: '.000001',
        rateUnit: 'b'
      })
    ).toMatchObject({
      kind: 'error',
      message: expect.stringContaining('too large')
    });
  });
  it.each([
    [0, '0 s'],
    [0.08, 'Less than 1 s'],
    [1, '1 s'],
    [10.24, '11 s'],
    [60, '1 min'],
    [80, '1 min 20 s'],
    [3600, '1 h'],
    [86400, '1 d'],
    [90061, '1 d 1 h 1 min 1 s']
  ])('formats %s seconds as %s', (seconds, formatted) => {
    expect(formatDuration(seconds as number)).toBe(formatted);
  });
  it('formats decimal seconds without discarding subsecond precision', () => {
    expect(formatNumber(10.24)).toBe('10.24');
    expect(formatNumber(0.000001)).toBe('0.000001');
    expect(formatNumber(100_000_000)).toBe('100,000,000');
  });
});

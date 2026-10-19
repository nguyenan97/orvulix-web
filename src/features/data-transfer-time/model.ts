export const UNITS = [
  { symbol: 'b', name: 'bits', bits: 1 },
  { symbol: 'B', name: 'bytes', bits: 8 },
  ...(
    [
      ['k', 'kilo', 1000],
      ['M', 'mega', 1000 ** 2],
      ['G', 'giga', 1000 ** 3],
      ['T', 'tera', 1000 ** 4],
      ['Ki', 'kibi', 1024],
      ['Mi', 'mebi', 1024 ** 2],
      ['Gi', 'gibi', 1024 ** 3],
      ['Ti', 'tebi', 1024 ** 4]
    ] as const
  ).flatMap(([prefix, name, factor]) => [
    { symbol: `${prefix}b`, name: `${name}bits`, bits: factor },
    { symbol: `${prefix}B`, name: `${name}bytes`, bits: factor * 8 }
  ])
] as const;
export interface TransferInput {
  size: string;
  sizeUnit: string;
  rate: string;
  rateUnit: string;
  efficiency: string;
}
export type Field = 'size' | 'rate' | 'efficiency';
export type Estimate =
  | { kind: 'incomplete' }
  | { kind: 'error'; field?: Field; message: string }
  | { kind: 'success'; seconds: number; effectiveBitsPerSecond: number };
const labels: Record<Field, string> = {
  size: 'Data size',
  rate: 'Transfer rate',
  efficiency: 'Efficiency'
};
class InputError extends Error {
  constructor(
    public readonly field: Field,
    message: string
  ) {
    super(message);
  }
}
function parse(value: string, field: Field): number {
  if (value.length > 32 || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))
    throw new InputError(
      field,
      `${labels[field]} must be a decimal number of at most 32 characters, without commas or exponent notation.`
    );
  const number = Number(value.trim());
  const max = field === 'efficiency' ? 100 : 1e15;
  if (
    !Number.isFinite(number) ||
    number < 0 ||
    number > max ||
    (field !== 'size' && number === 0)
  )
    throw new InputError(
      field,
      field === 'efficiency'
        ? 'Efficiency must be greater than 0 and at most 100%.'
        : `${labels[field]} must be ${
            field === 'size' ? '0 or greater' : 'greater than 0'
          } and at most 1,000,000,000,000,000.`
    );
  return number;
}
export function estimateTransfer(input: TransferInput): Estimate {
  try {
    for (const field of ['size', 'rate', 'efficiency'] as const)
      if (input[field].length > 32)
        throw new InputError(
          field,
          `${labels[field]} must contain at most 32 characters.`
        );
    const sizeUnit = UNITS.find(({ symbol }) => symbol === input.sizeUnit);
    const rateUnit = UNITS.find(({ symbol }) => symbol === input.rateUnit);
    if (!sizeUnit || !rateUnit)
      return {
        kind: 'error',
        message: 'Choose a supported size and rate unit.'
      };
    // Validate provided fields even while another field is incomplete.
    const size = input.size.trim() ? parse(input.size, 'size') : undefined;
    const rate = input.rate.trim() ? parse(input.rate, 'rate') : undefined;
    const efficiency = input.efficiency.trim()
      ? parse(input.efficiency, 'efficiency')
      : 100;
    if (size === undefined || rate === undefined) return { kind: 'incomplete' };
    const effectiveBitsPerSecond = rate * rateUnit.bits * (efficiency / 100);
    const seconds = (size * sizeUnit.bits) / effectiveBitsPerSecond;
    if (!Number.isFinite(seconds) || seconds > Number.MAX_SAFE_INTEGER)
      return {
        kind: 'error',
        message:
          'Estimated duration is too large. Reduce the size or increase the effective rate.'
      };
    return { kind: 'success', seconds, effectiveBitsPerSecond };
  } catch (failure) {
    if (failure instanceof InputError)
      return { kind: 'error', field: failure.field, message: failure.message };
    throw failure;
  }
}
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 8 }).format(
    value
  );
}
export function formatDuration(seconds: number): string {
  if (seconds === 0) return '0 s';
  if (seconds < 1) return 'Less than 1 s';
  let remaining = Math.ceil(seconds);
  return (
    [
      [86400, 'd'],
      [3600, 'h'],
      [60, 'min'],
      [1, 's']
    ] as const
  )
    .flatMap(([unit, label]) => {
      const count = Math.floor(remaining / unit);
      remaining %= unit;
      return count ? [`${count} ${label}`] : [];
    })
    .join(' ');
}

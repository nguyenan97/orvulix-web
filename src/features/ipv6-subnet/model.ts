export interface Subnet {
  address: string;
  expandedAddress: string;
  prefix: number;
  cidr: string;
  firstAddress: string;
  lastAddress: string;
  totalAddresses: string;
}
export type Result =
  | { kind: 'incomplete' }
  | { kind: 'error'; field: 'address' | 'prefix'; message: string }
  | { kind: 'success'; value: Subnet };

function parseAddress(source: string): bigint {
  const invalid = () => {
    throw Error(
      'Enter a full or compressed IPv6 address without zones, brackets, ports or spaces.'
    );
  };
  let value = source;
  if (value.includes('.')) {
    const tailStart = value.lastIndexOf(':');
    if (tailStart < 0) return invalid();
    const octets = value.slice(tailStart + 1).split('.');
    if (
      octets.length !== 4 ||
      octets.some(
        (octet) => !/^(?:0|[1-9]\d{0,2})$/.test(octet) || Number(octet) > 255
      )
    )
      return invalid();
    const [a, b, c, d] = octets.map(Number);
    value = `${value.slice(0, tailStart + 1)}${(a * 256 + b).toString(16)}:${(
      c * 256 +
      d
    ).toString(16)}`;
  }
  const halves = value.split('::');
  if (halves.length > 2) return invalid();
  const groups = (part: string) => (part ? part.split(':') : []);
  const left = groups(halves[0]);
  const right = halves.length === 2 ? groups(halves[1]) : [];
  const explicit = [...left, ...right];
  if (explicit.some((group) => !/^[0-9a-fA-F]{1,4}$/.test(group)))
    return invalid();
  const missing = 8 - explicit.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return invalid();
  const expanded = [...left, ...Array<string>(missing).fill('0'), ...right];
  return BigInt(
    `0x${expanded.map((group) => group.padStart(4, '0')).join('')}`
  );
}
function expandedAddress(value: bigint): string {
  return value.toString(16).padStart(32, '0').match(/.{4}/g)!.join(':');
}
function formatAddress(value: bigint): string {
  const groups = expandedAddress(value)
    .split(':')
    .map((group) => Number.parseInt(group, 16).toString(16));
  let bestStart = -1,
    bestLength = 1;
  for (let start = 0; start < groups.length; ) {
    if (groups[start] !== '0') {
      start++;
      continue;
    }
    let end = start;
    while (end < groups.length && groups[end] === '0') end++;
    if (end - start > bestLength) {
      bestStart = start;
      bestLength = end - start;
    }
    start = end;
  }
  if (bestStart < 0) return groups.join(':');
  return `${groups.slice(0, bestStart).join(':')}::${groups
    .slice(bestStart + bestLength)
    .join(':')}`;
}
function parsePrefix(value: string): number {
  if (!/^(?:0|[1-9]\d{0,2})$/.test(value) || Number(value) > 128)
    throw Error('Enter a prefix from 0 to 128 without leading zeros.');
  return Number(value);
}
export function calculateSubnet(addressRaw: string, prefixRaw: string): Result {
  let field: 'address' | 'prefix' = 'address';
  try {
    if (addressRaw.length > 80)
      throw Error('IPv6 address or CIDR must contain at most 80 characters.');
    const source = addressRaw.trim();
    if (!source) return { kind: 'incomplete' };
    const parts = source.split('/');
    if (parts.length > 2)
      throw Error('Use one IPv6 address followed by at most one /prefix.');
    const address = parseAddress(parts[0]);
    let prefix: number;
    if (parts.length === 2) prefix = parsePrefix(parts[1]);
    else {
      field = 'prefix';
      if (prefixRaw.length > 80)
        throw Error('Prefix must contain at most 80 characters.');
      const manual = prefixRaw.trim();
      if (!manual) return { kind: 'incomplete' };
      prefix = parsePrefix(manual.startsWith('/') ? manual.slice(1) : manual);
    }
    const hostBits = BigInt(128 - prefix);
    const total = 1n << hostBits;
    const first = (address >> hostBits) << hostBits;
    return {
      kind: 'success',
      value: {
        address: formatAddress(address),
        expandedAddress: expandedAddress(address),
        prefix,
        cidr: `${formatAddress(first)}/${prefix}`,
        firstAddress: formatAddress(first),
        lastAddress: formatAddress(first + total - 1n),
        totalAddresses: total.toString()
      }
    };
  } catch (error) {
    return {
      kind: 'error',
      field,
      message:
        error instanceof Error
          ? error.message
          : 'Could not calculate this IPv6 subnet.'
    };
  }
}

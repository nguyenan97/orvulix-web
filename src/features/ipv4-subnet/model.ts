const ADDRESS_SPACE = 2 ** 32;
export interface Subnet {
  address: string;
  prefix: number;
  cidr: string;
  network: string;
  mask: string;
  wildcard: string;
  lastAddress: string;
  broadcast: string | null;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  hostCount: number;
}
export type Result =
  | { kind: 'incomplete' }
  | { kind: 'error'; field: 'address' | 'subnet'; message: string }
  | { kind: 'success'; value: Subnet };
function parseAddress(value: string): number {
  const octets = value.split('.');
  if (
    octets.length !== 4 ||
    octets.some(
      (part) => !/^(?:0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255
    )
  )
    throw Error(
      'Enter four decimal octets from 0 to 255 without leading zeros. IPv6 is not supported.'
    );
  return octets.reduce((number, octet) => number * 256 + Number(octet), 0);
}
function formatAddress(value: number): string {
  return [24, 16, 8, 0]
    .map((shift) => Math.floor(value / 2 ** shift) % 256)
    .join('.');
}
function parsePrefix(value: string): number {
  if (!/^(?:0|[1-9]\d?)$/.test(value) || Number(value) > 32)
    throw Error('Enter a CIDR prefix from 0 to 32 without leading zeros.');
  return Number(value);
}
function parseMask(value: string): number {
  if (!value.includes('.'))
    return parsePrefix(value.startsWith('/') ? value.slice(1) : value);
  const bits = parseAddress(value);
  const hostBits = Math.log2(ADDRESS_SPACE - bits);
  if (!Number.isInteger(hostBits))
    throw Error(
      'Subnet mask must contain contiguous high one bits followed by zero bits.'
    );
  return 32 - hostBits;
}
export function calculateSubnet(addressRaw: string, maskRaw: string): Result {
  let field: 'address' | 'subnet' = 'address';
  try {
    if (addressRaw.length > 64)
      throw Error('IPv4 address or CIDR must contain at most 64 characters.');
    const source = addressRaw.trim();
    if (!source) return { kind: 'incomplete' };
    const parts = source.split('/');
    if (parts.length > 2)
      throw Error('Use one IPv4 address followed by at most one /prefix.');
    const address = parseAddress(parts[0]);
    let prefix: number;
    if (parts.length === 2) prefix = parsePrefix(parts[1]);
    else {
      field = 'subnet';
      if (maskRaw.length > 64)
        throw Error(
          'Subnet prefix or mask must contain at most 64 characters.'
        );
      if (!maskRaw.trim()) return { kind: 'incomplete' };
      prefix = parseMask(maskRaw.trim());
    }
    const totalAddresses = 2 ** (32 - prefix);
    const network = Math.floor(address / totalAddresses) * totalAddresses;
    const last = network + totalAddresses - 1;
    const mask = ADDRESS_SPACE - totalAddresses;
    return {
      kind: 'success',
      value: {
        address: formatAddress(address),
        prefix,
        cidr: `${formatAddress(network)}/${prefix}`,
        network: formatAddress(network),
        mask: formatAddress(mask),
        wildcard: formatAddress(totalAddresses - 1),
        lastAddress: formatAddress(last),
        broadcast: prefix >= 31 ? null : formatAddress(last),
        firstHost: formatAddress(prefix >= 31 ? network : network + 1),
        lastHost: formatAddress(prefix >= 31 ? last : last - 1),
        totalAddresses,
        hostCount: prefix >= 31 ? totalAddresses : totalAddresses - 2
      }
    };
  } catch (error) {
    return {
      kind: 'error',
      field,
      message:
        error instanceof Error
          ? error.message
          : 'Could not calculate this subnet.'
    };
  }
}

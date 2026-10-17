import { ConversionError, type Yaml } from './model';

export const namePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
export function image(value: string) {
  const [reference, digest, ...extra] = value.split('@');
  if (
    extra.length ||
    (digest !== undefined && !/^sha256:[a-fA-F0-9]{64}$/.test(digest))
  )
    throw new ConversionError('image');
  const colon = reference.lastIndexOf(':');
  const tagged = colon > reference.lastIndexOf('/');
  const repository = tagged ? reference.slice(0, colon) : reference;
  if (
    tagged &&
    !/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/.test(reference.slice(colon + 1))
  )
    throw new ConversionError('image');
  const parts = repository.split('/');
  if (parts.length > 1 && /[.:]|^localhost$/.test(parts[0])) {
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*(?::[0-9]{1,5})?$/.test(parts.shift()!))
      throw new ConversionError('image');
  }
  if (
    repository.length > 255 ||
    !parts.every((part) => /^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*$/.test(part))
  )
    throw new ConversionError('image');
  return value;
}
export function port(value: string) {
  const [mapping, protocol, ...extra] = value.split('/');
  if (
    extra.length ||
    (protocol !== undefined && !['tcp', 'udp'].includes(protocol))
  )
    throw new ConversionError('port');
  let source = mapping;
  if (source.startsWith('[')) {
    const end = source.indexOf(']:');
    if (end < 0) throw new ConversionError('port');
    try {
      new URL(`http://${source.slice(0, end + 1)}/`);
    } catch {
      throw new ConversionError('port');
    }
    source = source.slice(end + 2);
    if (source.split(':').length !== 2) throw new ConversionError('port');
  } else if (source.split(':').length === 3) {
    const [host, ...rest] = source.split(':');
    if (
      !/^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      !host
        .split('.')
        .every(
          (octet) => /^(0|[1-9]\d{0,2})$/.test(octet) && Number(octet) <= 255
        )
    )
      throw new ConversionError('port');
    source = rest.join(':');
  }
  const parts = source.split(':');
  if (parts.length > 2) throw new ConversionError('port');
  const ranges = parts.map((part) => {
    if (!/^\d{1,5}(?:-\d{1,5})?$/.test(part)) throw new ConversionError('port');
    const [low, high = low] = part.split('-').map(Number);
    if (low < 1 || high > 65535 || high < low)
      throw new ConversionError('port');
    return high - low;
  });
  if (ranges.length === 2 && ranges[0] !== ranges[1])
    throw new ConversionError('port');
  return value;
}
export function mount(value: string): {
  target: string;
  source?: string;
  kind: 'bind' | 'volume';
  readOnly: boolean;
} {
  const windows = /^[A-Za-z]:[\\/]/.test(value);
  const parts = (windows ? value.slice(2) : value).split(':');
  if (windows) parts[0] = value.slice(0, 2) + parts[0];
  if (parts.length > 3 || parts.some((part) => part === ''))
    throw new ConversionError('volume');
  const [source, target, mode] =
    parts.length === 1
      ? [undefined, parts[0], undefined]
      : parts.length === 2 && ['ro', 'rw'].includes(parts[1])
        ? [undefined, parts[0], parts[1]]
        : parts;
  if (
    !target?.startsWith('/') ||
    (mode !== undefined && mode !== 'ro' && mode !== 'rw') ||
    (source !== undefined &&
      !source.startsWith('/') &&
      !windows &&
      !namePattern.test(source))
  )
    throw new ConversionError('volume');
  return {
    target,
    source,
    kind: source && (source.startsWith('/') || windows) ? 'bind' : 'volume',
    readOnly: mode === 'ro'
  };
}
export function mountYaml(
  value: ReturnType<typeof mount>,
  source?: string
): { [key: string]: Yaml } {
  return {
    type: value.kind,
    ...(source === undefined ? {} : { source }),
    target: value.target,
    read_only: value.readOnly
  };
}

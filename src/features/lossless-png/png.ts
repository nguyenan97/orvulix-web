export const LIMITS = {
  bytes: 4 * 1024 * 1024,
  side: 4096,
  pixels: 4_000_000,
  chunks: 512,
  inflated: 32 * 1024 * 1024,
  timeout: 15_000
} as const;
const SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const byte of bytes) value = TABLE[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
export function checkSize(size: number) {
  if (!Number.isSafeInteger(size) || size < 45 || size > LIMITS.bytes)
    throw Error('Choose a static PNG between 45 bytes and 4 MiB.');
}
type Chunk = { type: string; bytes: Uint8Array; data: Uint8Array };
type Pass = { width: number; height: number; rowBytes: number };
export type ParsedPng = {
  width: number;
  height: number;
  depth: number;
  color: number;
  palette: number;
  expected: number;
  passes: Pass[];
  chunks: Chunk[];
};
const METADATA = new Set([
  'gAMA',
  'cHRM',
  'sRGB',
  'iCCP',
  'pHYs',
  'tEXt',
  'zTXt',
  'iTXt',
  'eXIf',
  'tIME'
]);
const BEFORE_PALETTE = new Set(['gAMA', 'cHRM', 'sRGB', 'iCCP']);
export function parsePng(bytes: Uint8Array): ParsedPng {
  checkSize(bytes.length);
  if (SIGNATURE.some((b, i) => bytes[i] !== b))
    throw Error('Invalid PNG signature.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Chunk[] = [],
    seen = new Set<string>();
  let offset = 8,
    width = 0,
    height = 0,
    depth = 0,
    color = 0,
    channels = 0,
    interlace = 0,
    palette = 0,
    hasData = false,
    dataEnded = false,
    dataBytes = 0,
    ended = false;
  while (offset < bytes.length) {
    if (chunks.length >= LIMITS.chunks || offset + 12 > bytes.length)
      throw Error('PNG has excessive or truncated chunks.');
    const length = view.getUint32(offset),
      end = offset + length + 12;
    if (end > bytes.length) throw Error('Truncated PNG chunk.');
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)),
      data = bytes.subarray(offset + 8, end - 4);
    if (!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type))
      throw Error('Invalid PNG chunk type.');
    if (crc(bytes.subarray(offset + 4, end - 4)) !== view.getUint32(end - 4))
      throw Error('PNG checksum (CRC) is invalid.');
    if (['acTL', 'fcTL', 'fdAT'].includes(type))
      throw Error('Animated PNG is not supported.');
    if (!chunks.length && type !== 'IHDR')
      throw Error('PNG must start with IHDR.');
    if (type === 'IHDR') {
      if (chunks.length || length !== 13)
        throw Error('Invalid or duplicate PNG header.');
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      depth = data[8];
      color = data[9];
      interlace = data[12];
      const depths: Record<number, number[]> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16]
      };
      if (
        !depths[color]?.includes(depth) ||
        data[10] ||
        data[11] ||
        interlace > 1
      )
        throw Error('Unsupported PNG color, depth or encoding method.');
      channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[
        color
      ];
      if (
        !width ||
        !height ||
        width > LIMITS.side ||
        height > LIMITS.side ||
        width * height > LIMITS.pixels
      )
        throw Error('PNG must fit 4096 pixels per side and 4 million pixels.');
    } else if (type === 'PLTE') {
      if (
        hasData ||
        seen.has(type) ||
        seen.has('tRNS') ||
        color === 0 ||
        color === 4 ||
        !length ||
        length % 3 ||
        length > 768
      )
        throw Error('Invalid PNG palette or palette order.');
      palette = length / 3;
      if (color === 3 && palette > 2 ** depth)
        throw Error('PNG palette exceeds its bit depth.');
    } else if (type === 'tRNS') {
      if (
        hasData ||
        seen.has(type) ||
        ![0, 2, 3].includes(color) ||
        (color === 3
          ? !palette || !length || length > palette
          : length !== (color === 0 ? 2 : 6))
      )
        throw Error('Invalid PNG transparency or transparency order.');
      if (color !== 3)
        for (let i = 0; i < length; i += 2)
          if (view.getUint16(offset + 8 + i) >= 2 ** depth)
            throw Error('PNG transparency sample exceeds bit depth.');
    } else if (type === 'IDAT') {
      if (dataEnded || (color === 3 && !palette))
        throw Error(
          'PNG IDAT chunks must be consecutive and follow its palette.'
        );
      hasData = true;
      dataBytes += length;
    } else if (type === 'IEND') {
      if (length || !hasData || !dataBytes || end !== bytes.length)
        throw Error('Invalid PNG ending or trailing bytes.');
      ended = true;
    } else {
      if (
        !METADATA.has(type) &&
        (type.charCodeAt(0) < 97 || type.charCodeAt(3) < 97)
      )
        throw Error(
          `Unsupported PNG chunk ${type}; cannot preserve it safely.`
        );
      if (BEFORE_PALETTE.has(type) && (hasData || seen.has('PLTE')))
        throw Error('PNG color metadata must precede palette and image data.');
      if (type === 'pHYs' && hasData)
        throw Error('PNG physical dimensions must precede image data.');
      if (
        ['gAMA', 'cHRM', 'sRGB', 'iCCP', 'pHYs', 'eXIf', 'tIME'].includes(
          type
        ) &&
        seen.has(type)
      )
        throw Error('Duplicate PNG metadata.');
      if (
        (type === 'gAMA' && (length !== 4 || !view.getUint32(offset + 8))) ||
        (type === 'cHRM' && length !== 32) ||
        (type === 'sRGB' && (length !== 1 || data[0] > 3)) ||
        (type === 'pHYs' && (length !== 9 || data[8] > 1)) ||
        (type === 'tIME' && length !== 7) ||
        (type === 'eXIf' && length < 8)
      )
        throw Error('Invalid PNG metadata shape.');
      if (['tEXt', 'zTXt', 'iTXt', 'iCCP'].includes(type)) {
        const separator = data.indexOf(0);
        if (separator < 1 || separator > 79)
          throw Error('Invalid PNG metadata keyword.');
        if (
          ['zTXt', 'iCCP'].includes(type) &&
          (data[separator + 1] !== 0 || length < separator + 8)
        )
          throw Error('Invalid compressed PNG metadata shape.');
        if (
          type === 'iTXt' &&
          (length < separator + 5 ||
            data[separator + 1] > 1 ||
            data[separator + 2] !== 0 ||
            data.indexOf(0, separator + 3) < 0 ||
            data.indexOf(0, data.indexOf(0, separator + 3) + 1) < 0)
        )
          throw Error('Invalid international PNG text shape.');
      }
      if (
        (type === 'iCCP' && seen.has('sRGB')) ||
        (type === 'sRGB' && seen.has('iCCP'))
      )
        throw Error('Conflicting PNG color profiles.');
    }
    if (hasData && type !== 'IDAT') dataEnded = true;
    chunks.push({ type, data, bytes: bytes.subarray(offset, end) });
    seen.add(type);
    offset = end;
  }
  if (!ended) throw Error('PNG is missing IEND.');
  const layout = interlace
    ? [
        [0, 0, 8, 8],
        [4, 0, 8, 8],
        [0, 4, 4, 8],
        [2, 0, 4, 4],
        [0, 2, 2, 4],
        [1, 0, 2, 2],
        [0, 1, 1, 2]
      ]
    : [[0, 0, 1, 1]];
  const passes = layout.flatMap(([x, y, dx, dy]) => {
    const w = Math.max(0, Math.ceil((width - x) / dx)),
      h = Math.max(0, Math.ceil((height - y) / dy));
    return w && h
      ? [
          {
            width: w,
            height: h,
            rowBytes: Math.ceil((w * channels * depth) / 8)
          }
        ]
      : [];
  });
  const expected = passes.reduce((n, p) => n + (p.rowBytes + 1) * p.height, 0);
  if (expected > LIMITS.inflated)
    throw Error('PNG filtered data exceeds 32 MiB.');
  return { width, height, depth, color, palette, expected, passes, chunks };
}
function paeth(a: number, b: number, c: number) {
  const p = a + b - c,
    x = Math.abs(p - a),
    y = Math.abs(p - b),
    z = Math.abs(p - c);
  return x <= y && x <= z ? a : y <= z ? b : c;
}
export function validateSamples(raw: Uint8Array, png: ParsedPng) {
  if (raw.length !== png.expected)
    throw Error('PNG inflated length does not match its header.');
  let offset = 0;
  for (const pass of png.passes) {
    let previous = new Uint8Array(pass.rowBytes);
    for (let y = 0; y < pass.height; y++) {
      const filter = raw[offset++];
      if (filter > 4) throw Error('Invalid PNG row filter.');
      if (png.color === 3) {
        const row = new Uint8Array(pass.rowBytes);
        for (let i = 0; i < row.length; i++) {
          const a = i ? row[i - 1] : 0,
            b = previous[i],
            c = i ? previous[i - 1] : 0;
          let prediction = 0;
          if (filter === 1) prediction = a;
          else if (filter === 2) prediction = b;
          else if (filter === 3) prediction = Math.floor((a + b) / 2);
          else if (filter === 4) prediction = paeth(a, b, c);
          row[i] = raw[offset + i] + prediction;
        }
        for (let x = 0; x < pass.width; x++) {
          const bit = x * png.depth;
          if (
            ((row[bit >> 3] >> (8 - png.depth - (bit % 8))) &
              ((1 << png.depth) - 1)) >=
            png.palette
          )
            throw Error('PNG sample references a missing palette entry.');
        }
        previous = row;
      }
      offset += pass.rowBytes;
    }
  }
}
export function join(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
export function replaceData(png: ParsedPng, compressed: Uint8Array) {
  const idat = new Uint8Array(compressed.length + 12),
    view = new DataView(idat.buffer);
  view.setUint32(0, compressed.length);
  idat.set([73, 68, 65, 84], 4);
  idat.set(compressed, 8);
  view.setUint32(idat.length - 4, crc(idat.subarray(4, -4)));
  let inserted = false;
  return join([
    SIGNATURE,
    ...png.chunks.flatMap((c) => {
      if (c.type !== 'IDAT') return [c.bytes];
      if (inserted) return [];
      inserted = true;
      return [idat];
    })
  ]);
}

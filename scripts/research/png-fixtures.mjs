// Trusted synthetic benchmark fixtures only, not an untrusted-file PNG parser.
import { deflateSync, inflateSync } from 'node:zlib';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});

export function chunk(type, data = Buffer.alloc(0)) {
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length);
  result.write(type, 4, 4, 'ascii');
  result.set(data, 8);
  let crc = 0xffffffff;
  for (const value of result.subarray(4, -4))
    crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8);
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}

export function chunks(png) {
  const result = [];
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    const end = offset + length + 12;
    if (end > png.length) throw Error('Truncated benchmark output');
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, end - 4);
    const bytes = png.subarray(offset, end);
    if (!chunk(type, data).equals(bytes)) throw Error('Invalid output CRC');
    result.push({ type, data, bytes });
    offset = end;
  }
  return result;
}

export function idat(png) {
  return Buffer.concat(
    chunks(png)
      .filter((c) => c.type === 'IDAT')
      .map((c) => c.data)
  );
}

export function filtered(png) {
  return inflateSync(idat(png), { maxOutputLength: 32 * 1024 * 1024 });
}

export function replaceIdat(png, compressed) {
  let inserted = false;
  return Buffer.concat([
    signature,
    ...chunks(png).flatMap((c) => {
      if (c.type !== 'IDAT') return [c.bytes];
      if (inserted) return [];
      inserted = true;
      return [chunk('IDAT', compressed)];
    })
  ]);
}

export function nonIdat(png) {
  return Buffer.concat(
    chunks(png)
      .filter((c) => c.type !== 'IDAT')
      .map((c) => c.bytes)
  );
}

function fixture(
  name,
  pixel,
  {
    depth = 8,
    indexed = false,
    interlace = false,
    level = 0,
    metadata = false,
    width = 256,
    height = 192
  } = {}
) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = indexed ? 2 : depth;
  header[9] = indexed ? 3 : 6;
  header[12] = Number(interlace);
  const passes = interlace
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
  const rows = [];
  for (const [sx, sy, dx, dy] of passes) {
    if (sx >= width || sy >= height) continue;
    for (let y = sy; y < height; y += dy) {
      const count = Math.ceil((width - sx) / dx);
      const row = Buffer.alloc(
        1 + (indexed ? Math.ceil(count / 4) : (count * 4 * depth) / 8)
      );
      let n = 0;
      for (let x = sx; x < width; x += dx, n++) {
        if (indexed) row[1 + (n >> 2)] |= (x + y) % 4 << (6 - 2 * (n % 4));
        else
          pixel(x, y).forEach((v, channel) => {
            if (depth === 16) row.writeUInt16BE(v, 1 + (n * 4 + channel) * 2);
            else row[1 + n * 4 + channel] = v;
          });
      }
      rows.push(row);
    }
  }
  const png = Buffer.concat([
    signature,
    chunk('IHDR', header),
    ...(indexed
      ? [
          chunk(
            'PLTE',
            Buffer.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255])
          ),
          chunk('tRNS', Buffer.from([255, 192, 0, 255]))
        ]
      : []),
    ...(metadata
      ? [
          chunk('gAMA', Buffer.from([0, 0, 177, 143])),
          chunk('pHYs', Buffer.from([0, 0, 14, 196, 0, 0, 14, 196, 1])),
          chunk(
            'tEXt',
            Buffer.from('Description\0Synthetic benchmark, no user data')
          )
        ]
      : []),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level })),
    chunk('IEND')
  ]);
  return { name, png, width, height, depth: indexed ? 2 : depth, interlace };
}

export function fixtures() {
  const flat = (x, y) => [
    x % 32 < 16 ? 255 : 0,
    y % 32 < 16 ? 255 : 0,
    80,
    255
  ];
  const gradient = (x, y) => [x, y, (x * 13 + y * 17) % 256, 255];
  const noise = (x, y) => {
    let n = Math.imul(x + y * 256 + 1, 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n ^= n >>> 16;
    return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, 255];
  };
  return [
    fixture('flat-uncompressed', flat),
    fixture('flat-zlib9', flat, { level: 9 }),
    fixture('gradient-many-colors', gradient),
    fixture('noise-zlib9', noise, { level: 9 }),
    fixture('alpha-hidden-rgb', (x, y) => [x, y, 211, x % 4 === 0 ? 0 : x], {
      metadata: true
    }),
    fixture('metadata-opaque', flat, { metadata: true }),
    fixture(
      'rgba16-low-bits',
      (x, y) => [x * 257 + (y % 2), y * 257 + (x % 2), 32769, 65535],
      { depth: 16 }
    ),
    fixture('indexed-2bit', flat, { indexed: true, width: 257 }),
    fixture('adam7-rgba8', gradient, {
      interlace: true,
      width: 255,
      height: 191
    })
  ];
}

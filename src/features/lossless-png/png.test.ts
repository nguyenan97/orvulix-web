// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  fixtures,
  chunk,
  chunks,
  filtered,
  nonIdat
} from '../../../scripts/research/png-fixtures.mjs';
import { deflateSync } from 'node:zlib';
import { checkSize, LIMITS, parsePng, validateSamples } from './png';
import { optimizePng } from './optimize';

const source = () => fixtures()[0].png;
const assemble = (items: { type: string; data: Uint8Array }[]) =>
  Buffer.concat([
    source().subarray(0, 8),
    ...items.map((c) => chunk(c.type, Buffer.from(c.data)))
  ]);
function header(change: (data: Buffer) => void) {
  const items = chunks(source());
  const data = Buffer.from(items[0].data);
  change(data);
  return assemble([{ type: 'IHDR', data }, ...items.slice(1)]);
}
function dataFile(raw: Uint8Array) {
  const items = chunks(source());
  const data = Buffer.from(items[0].data);
  data.writeUInt32BE(1, 0);
  data.writeUInt32BE(1, 4);
  return assemble([
    { type: 'IHDR', data },
    { type: 'IDAT', data: deflateSync(raw) },
    { type: 'IEND', data: Buffer.alloc(0) }
  ]);
}

describe('lossless PNG admission', () => {
  it('accepts the real static PNG corpus including 16-bit, palette and Adam7', () => {
    for (const image of fixtures()) {
      expect(parsePng(new Uint8Array(image.png))).toMatchObject({
        width: image.width,
        height: image.height
      });
    }
  });
  it('rejects CRC corruption, signature/truncation/trailing data and duplicate headers', () => {
    const bad = Buffer.from(source());
    bad[29] ^= 1;
    expect(() => parsePng(bad)).toThrow(/CRC/);
    const signature = Buffer.from(source());
    signature[0] = 0;
    for (const bytes of [
      signature,
      source().subarray(0, -1),
      Buffer.concat([source(), Buffer.from([1])]),
      assemble([chunks(source())[0], ...chunks(source())])
    ])
      expect(() => parsePng(bytes)).toThrow();
  });
  it('bounds bytes, dimensions, color/depth combinations and chunk count', () => {
    for (const size of [0, 44, LIMITS.bytes + 1, NaN, Infinity])
      expect(() => checkSize(size)).toThrow();
    for (const change of [
      (b: Buffer) => b.writeUInt32BE(4097, 0),
      (b: Buffer) => {
        b.writeUInt32BE(2048, 0);
        b.writeUInt32BE(2048, 4);
      },
      (b: Buffer) => {
        b[8] = 4;
        b[9] = 6;
      },
      (b: Buffer) => {
        b[12] = 2;
      },
      (b: Buffer) => {
        b[10] = 1;
      }
    ])
      expect(() => parsePng(header(change))).toThrow();
    const items = chunks(source());
    expect(() =>
      parsePng(
        assemble([
          items[0],
          ...Array.from({ length: 512 }, () => ({
            type: 'vpAg',
            data: Buffer.alloc(0)
          })),
          ...items.slice(1)
        ])
      )
    ).toThrow(/excessive/);
  });
  it('rejects animation and unsafe unknown chunks, preserves safe ancillary bytes', () => {
    const items = chunks(source());
    for (const type of ['acTL', 'fcTL', 'fdAT', 'vpAG', 'ABCD'])
      expect(() =>
        parsePng(
          assemble([
            items[0],
            { type, data: Buffer.alloc(8) },
            ...items.slice(1)
          ])
        )
      ).toThrow();
    expect(
      parsePng(
        assemble([
          items[0],
          { type: 'vpAg', data: Buffer.from('opaque') },
          ...items.slice(1)
        ])
      ).chunks[1].type
    ).toBe('vpAg');
  });
  it('enforces palette/transparency and consecutive IDAT order', () => {
    const items = chunks(
      fixtures().find((f) => f.name === 'indexed-2bit')!.png
    );
    expect(() =>
      parsePng(assemble(items.filter((c) => c.type !== 'PLTE')))
    ).toThrow();
    const base = chunks(source()),
      id = base[1].data;
    expect(() =>
      parsePng(
        assemble([
          base[0],
          { type: 'IDAT', data: id.subarray(0, 3) },
          { type: 'tEXt', data: Buffer.from('x\0y') },
          { type: 'IDAT', data: id.subarray(3) },
          base[2]
        ])
      )
    ).toThrow(/consecutive/);
    expect(() =>
      parsePng(assemble([...base.slice(0, 2), items[1], base[2]]))
    ).toThrow(/palette/);
    expect(() =>
      parsePng(
        assemble([
          base[0],
          { type: 'tRNS', data: Buffer.alloc(6) },
          ...base.slice(1)
        ])
      )
    ).toThrow(/transparency/);
  });
  it('unfilters indexed rows for all five filters before validating palette references', () => {
    const items = chunks(
        fixtures().find((f) => f.name === 'indexed-2bit')!.png
      ),
      h = Buffer.from(items[0].data);
    h.writeUInt32BE(3, 0);
    h.writeUInt32BE(2, 4);
    h[8] = 8;
    const png = parsePng(
      assemble([
        { type: 'IHDR', data: h },
        { type: 'PLTE', data: items[1].data.subarray(0, 9) },
        { type: 'IDAT', data: deflateSync(Buffer.alloc(8)) },
        { type: 'IEND', data: Buffer.alloc(0) }
      ])
    );
    const rows = [
      [
        [0, 1, 2],
        [2, 1, 0]
      ],
      [
        [0, 1, 1],
        [2, 255, 255]
      ],
      [
        [0, 1, 2],
        [2, 0, 254]
      ],
      [
        [0, 1, 2],
        [2, 0, 255]
      ],
      [
        [0, 1, 1],
        [2, 255, 254]
      ]
    ];
    rows.forEach(([a, b], filter) =>
      expect(() =>
        validateSamples(new Uint8Array([filter, ...a, filter, ...b]), png)
      ).not.toThrow()
    );
    expect(() =>
      validateSamples(new Uint8Array([0, 0, 1, 3, 0, 0, 1, 2]), png)
    ).toThrow(/palette/);
  });
});

describe('native PNG recompression', () => {
  it('preserves every scanline and non-IDAT byte across the corpus without inflation', async () => {
    for (const file of fixtures()) {
      const output = Buffer.from(await optimizePng(new Uint8Array(file.png)));
      expect(output.length).toBeLessThanOrEqual(file.png.length);
      expect(filtered(output)).toEqual(filtered(file.png));
      expect(nonIdat(output)).toEqual(nonIdat(file.png));
    }
    const original = fixtures().find((f) => f.name === 'flat-zlib9')!.png;
    expect(Buffer.from(await optimizePng(new Uint8Array(original)))).toEqual(
      original
    );
  });
  it('rejects declared expansion mismatch, invalid filters and corrupt compressed streams', async () => {
    for (const raw of [
      Buffer.alloc(100_000),
      Buffer.alloc(4),
      Buffer.from([5, 1, 2, 3, 255])
    ])
      await expect(optimizePng(new Uint8Array(dataFile(raw)))).rejects.toThrow(
        /expansion|length|filter/
      );
    const items = chunks(source());
    await expect(
      optimizePng(
        new Uint8Array(
          assemble([
            items[0],
            { type: 'IDAT', data: Buffer.from('not-zlib') },
            items[2]
          ])
        )
      )
    ).rejects.toThrow();
  });
});

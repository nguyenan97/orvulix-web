import { describe, expect, it } from 'vitest';
import { convertCsvToJson } from './service';
import { convertTsvToJson } from '../tsv-to-json/service';

const options = {
  delimiter: '\t',
  quote: '"',
  comment: '#',
  useHeaders: true,
  skipEmptyLines: true,
  dynamicTypes: true,
  indentationType: 'space' as const,
  spacesCount: 2
};

for (const delimiter of [',', '\t']) {
  const convert = (source: string) =>
    delimiter === ','
      ? convertCsvToJson(source)
      : convertTsvToJson(source, options);
  describe(`${
    delimiter === ',' ? 'CSV' : 'TSV'
  } to JSON content and strict shape`, () => {
    it('preserves escaped quotes and multiline cells, including comment markers', () => {
      const source = `name${delimiter}note\r\nAlice${delimiter}"A ""B""\r\n#literal"`;
      expect(JSON.parse(convert(source))).toEqual([
        { name: 'Alice', note: 'A "B"\r\n#literal' }
      ]);
    });
    it('preserves quoted whitespace and quoted numeric identifiers', () => {
      expect(
        JSON.parse(convert(`name${delimiter}id\n"  Alice  "${delimiter}"001"`))
      ).toEqual([{ name: '  Alice  ', id: '001' }]);
    });
    it.each([
      `a${delimiter}b\n1`,
      `a${delimiter}b\n1${delimiter}2${delimiter}3`,
      `a${delimiter}a\n1${delimiter}2`,
      'a\n"unterminated',
      'a\n"closed"extra'
    ])('rejects malformed records without silent loss: %s', (source) => {
      expect(() => convert(source)).toThrow(/record|header|quote|field/i);
    });
    it('preserves own prototype-named headers', () => {
      const result = JSON.parse(
        convert(`__proto__${delimiter}constructor\nsafe${delimiter}value`)
      );
      expect(Object.keys(result[0])).toEqual(['__proto__', 'constructor']);
      expect(result[0].__proto__).toBe('safe');
    });
  });
}

it('supports a literal regex metacharacter delimiter and disabled comments', () => {
  expect(
    JSON.parse(convertCsvToJson('a]b\n1]2', { delimiter: ']', comment: '' }))
  ).toEqual([{ a: 1, b: 2 }]);
});
it('keeps empty cells empty and unsafe integers as strings', () => {
  expect(JSON.parse(convertCsvToJson('a,b,c\n,9007199254740993,true'))).toEqual(
    [{ a: '', b: '9007199254740993', c: true }]
  );
});
it('rejects excessive input and row counts before output allocation', () => {
  expect(() => convertCsvToJson('a'.repeat(1048577))).toThrow(
    /limit|large|MiB/i
  );
  expect(() => convertCsvToJson('a\n' + 'x\n'.repeat(20001))).toThrow(
    /record|row|limit/i
  );
});

it('handles comments, empty records, and quote-disabled parsing explicitly', () => {
  expect(
    JSON.parse(convertCsvToJson('# "comment\r\na,b\r1,2\r\n\r\n'))
  ).toEqual([{ a: 1, b: 2 }]);
  expect(JSON.parse(convertCsvToJson('a\n""\n\n'))).toEqual([{ a: '' }]);
  expect(
    JSON.parse(convertCsvToJson('a\n\n', { skipEmptyLines: false }))
  ).toEqual([{ a: '' }]);
  expect(JSON.parse(convertCsvToJson('a\n"literal"', { quote: '' }))).toEqual([
    { a: '"literal"' }
  ]);
  expect(
    JSON.parse(
      convertCsvToJson('001,true\n2,false', {
        useHeaders: false,
        dynamicTypes: false
      })
    )
  ).toEqual([
    ['001', 'true'],
    ['2', 'false']
  ]);
});

it.each([
  { delimiter: '' },
  { delimiter: '||' },
  { delimiter: '\n' },
  { quote: ',' },
  { quote: 'xx' },
  { comment: '\n' }
])('rejects ambiguous parser options: %j', (options) => {
  expect(() => convertCsvToJson('a\n1', options)).toThrow(
    /delimiter|quote|comment/i
  );
});

it('rejects excess columns and repeated-header output amplification', () => {
  expect(() => convertCsvToJson(Array(1025).fill('a').join(','))).toThrow(
    /column|field/i
  );
  expect(() =>
    convertCsvToJson('a'.repeat(10000) + '\n' + 'x\n'.repeat(220))
  ).toThrow(/output limit/i);
});

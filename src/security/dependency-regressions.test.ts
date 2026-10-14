import { describe, expect, it } from 'vitest';
import { beautifyXml } from '../pages/tools/xml/xml-beautifier/service';
import { validateXml } from '../pages/tools/xml/xml-validator/service';
import { unset, template } from 'lodash';
import { parse, Type, Field } from 'protobufjs';

describe('patched dependencies at real consumer boundaries', () => {
  it('preserves XML attributes, Unicode and formatting after the parser upgrade', () => {
    const input = '<invoice owner="Nguyễn An"><total>42</total></invoice>';
    expect(validateXml(input, {})).toBe('Valid XML');
    const result = beautifyXml(input, { preserveAttributes: true });
    expect(result).toContain('owner="Nguyễn An"');
    expect(result).toContain('<total>42</total>');
    expect(result).toContain('\n');
  });
  it('preserves out-of-range numeric entities as escaped text without an uncaught RangeError', () => {
    expect(
      beautifyXml('<root>&#9999999999999999;</root>', {
        preserveAttributes: true
      })
    ).toBe('<root>&amp;#9999999999999999;</root>\n');
  });
  it('bounds recursive DOCTYPE expansion rather than allocating exponential text', () => {
    const entities = ['<!ENTITY a "1234567890">'];
    for (let i = 1; i <= 12; i++) {
      const previous = String.fromCharCode(96 + i);
      entities.push(
        `<!ENTITY ${String.fromCharCode(97 + i)} "${`&${previous};`.repeat(
          10
        )}">`
      );
    }
    const result = beautifyXml(
      `<!DOCTYPE root [${entities.join('')}]><root>&m;</root>`,
      { preserveAttributes: true }
    );
    expect(result).toBe('<root>&amp;m;</root>\n');
    expect(result.length).toBeLessThan(1000);
  });
  it('does not execute crafted Lodash template imports or alter Object.prototype via array paths', () => {
    expect(() =>
      template('safe', {
        imports: { 'a=globalThis.__securityRegression=1': 1 }
      })
    ).toThrow();
    expect(Reflect.get(globalThis, '__securityRegression')).toBeUndefined();
    expect(unset({}, ['__proto__', 'toString'])).toBe(false);
    expect(typeof Object.prototype.toString).toBe('function');
  });
  it('preserves protobuf wire encoding used by ONNX and treats constructor fields as data', () => {
    const type = new Type('Tensor').add(new Field('data', 1, 'bytes'));
    const source = { data: new Uint8Array([1, 2, 255]) };
    expect(type.decode(type.encode(source).finish()).toJSON()).toEqual({
      data: 'AQL/'
    });
    expect(() =>
      parse('message Test { optional string a = 1 [default = "x"]; }')
        .root.lookupType('Test')
        .decode(new Uint8Array([10, 1, 120]))
        .toJSON()
    ).not.toThrow();
    const fieldType = new Type('Named').add(
      new Field('constructor', 1, 'string')
    );
    const value = fieldType.toObject(fieldType.create({ constructor: 'safe' }));
    expect(value.constructor).toBe('safe');
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    expect(typeof Object.prototype.constructor).toBe('function');
  });
});

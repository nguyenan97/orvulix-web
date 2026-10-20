import { expect, it } from 'vitest';
import { calculateSubnet } from './model';
import { isIP } from 'node:net';

function subnet(address: string, prefix = '/64') {
  const result = calculateSubnet(address, prefix);
  if (result.kind !== 'success') throw Error(JSON.stringify(result));
  return result.value;
}
it('calculates an exact /64 IPv6 range instead of losing precision', () => {
  expect(calculateSubnet('2001:DB8:abcd:1234::1/64', '/48')).toMatchObject({
    kind: 'success',
    value: {
      address: '2001:db8:abcd:1234::1',
      cidr: '2001:db8:abcd:1234::/64',
      firstAddress: '2001:db8:abcd:1234::',
      lastAddress: '2001:db8:abcd:1234:ffff:ffff:ffff:ffff',
      totalAddresses: '18446744073709551616'
    }
  });
});
it.each([
  [
    '::/0',
    '::',
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    '340282366920938463463374607431768211456'
  ],
  [
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/1',
    '8000::',
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    '170141183460469231731687303715884105728'
  ],
  [
    '2001:db8:abcd::1/33',
    '2001:db8:8000::',
    '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff',
    '39614081257132168796771975168'
  ],
  [
    '2001:db8:abcd:1234:ffff::1/65',
    '2001:db8:abcd:1234:8000::',
    '2001:db8:abcd:1234:ffff:ffff:ffff:ffff',
    '9223372036854775808'
  ],
  ['2001:db8::b/127', '2001:db8::a', '2001:db8::b', '2'],
  [
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128',
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    '1'
  ],
  ['::/128', '::', '::', '1']
])('keeps exact literal boundaries for %s', (input, first, last, count) => {
  expect(subnet(input)).toMatchObject({
    firstAddress: first,
    lastAddress: last,
    totalAddresses: count
  });
});
it.each([
  ['2001:0DB8:0000:0000:0001:0000:0000:0001', '2001:db8::1:0:0:1'],
  ['1:0:0:2:0:0:0:3', '1:0:0:2::3'],
  ['1:0:2:3:4:5:6:7', '1:0:2:3:4:5:6:7'],
  ['0:0:0:0:0:0:0:0', '::'],
  ['1:2:3:4:5:6:0:0', '1:2:3:4:5:6::'],
  ['0:0:1:2:3:4:5:6', '::1:2:3:4:5:6'],
  ['::ffff:192.0.2.128', '::ffff:c000:280'],
  ['1:2:3:4:5:6:192.0.2.128', '1:2:3:4:5:6:c000:280'],
  ['2001:db8::192.0.2.1', '2001:db8::c000:201'],
  ['1:2:3:4:5:6:7::', '1:2:3:4:5:6:7:0']
])('normalizes %s without changing its bits', (input, normalized) => {
  expect(isIP(input)).toBe(6);
  const result = subnet(input);
  expect(result.address).toBe(normalized);
  expect(isIP(result.address)).toBe(6);
  expect(subnet(result.expandedAddress)).toEqual(result);
});
it.each([
  '1:2:3:4:5:6:7',
  '1:2:3:4:5:6:7:8:9',
  '::1::',
  ':::1',
  ':1:2:3:4:5:6:7',
  '1:2:3:4:5:6:7:',
  '1:2:3:4:5:6:7:8::',
  '::12345',
  '::gg',
  '2001: db8::1',
  '::ffff:192.00.2.1',
  '::ffff:256.0.0.1',
  '::ffff:1.2.3',
  '::ffff:1.2.3.4.5',
  '1.2.3.4::',
  '1:2:3:4:5:192.0.2.1',
  '::ffff:+1.2.3.4',
  '::ffff:0x1.2.3.4',
  '::ffff:1e1.2.3.4',
  '::ffff:1.2.3.4:1',
  '::\n1',
  '::ffff:192\n.0.2.1',
  '1\n:2:3:4:5:6:7:8',
  '<script>',
  '１２::1'
])(
  'rejects malformed address %s, agreeing with Node input validity',
  (input) => {
    expect(isIP(input)).toBe(0);
    expect(calculateSubnet(input, '/64')).toMatchObject({
      kind: 'error',
      field: 'address'
    });
  }
);
it('rejects a valid plain IPv4 address rather than treating it as IPv6', () => {
  expect(isIP('192.0.2.1')).toBe(4);
  expect(calculateSubnet('192.0.2.1', '/64')).toMatchObject({
    kind: 'error',
    field: 'address'
  });
});
it.each(['fe80::1%eth0', '[::1]', 'https://[::1]', '[::1]:80'])(
  'rejects endpoint syntax %s',
  (input) => {
    expect(calculateSubnet(input, '/64').kind).toBe('error');
  }
);
it.each([
  '-1',
  '129',
  '064',
  '+64',
  '64.0',
  '6e1',
  '64/64',
  '//64',
  ' 64 0',
  '１２'
])('rejects invalid manual prefix %s', (prefix) => {
  expect(calculateSubnet('::1', prefix)).toMatchObject({
    kind: 'error',
    field: 'prefix'
  });
});
it('bounds raw inputs and ignores an inactive manual field', () => {
  expect(calculateSubnet(' '.repeat(80) + '::', '/64').kind).toBe('error');
  expect(calculateSubnet('::1', ' '.repeat(80) + '64').kind).toBe('error');
  expect(subnet(' ::1/128 ', 'x'.repeat(500)).totalAddresses).toBe('1');
  expect(calculateSubnet('', '/64').kind).toBe('incomplete');
  expect(calculateSubnet('::1', ' ').kind).toBe('incomplete');
  expect(calculateSubnet('::1/', '/64')).toMatchObject({
    kind: 'error',
    field: 'address'
  });
  expect(calculateSubnet('::1/64/64', '/64').kind).toBe('error');
  expect(subnet(' ::1 ', ' /128 ').cidr).toBe('::1/128');
  expect(subnet('::1', '0').cidr).toBe('::/0');
});
it('accepts every prefix with valid bounded output and an exact power-of-two count', () => {
  for (let prefix = 0; prefix <= 128; prefix++) {
    const value = subnet(`ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/${prefix}`);
    expect(isIP(value.firstAddress)).toBe(6);
    expect(value.lastAddress).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    expect(BigInt(value.totalAddresses).toString(2)).toBe(
      `1${'0'.repeat(128 - prefix)}`
    );
    expect(subnet(value.cidr)).toEqual({
      ...value,
      address: value.firstAddress,
      expandedAddress: subnet(value.firstAddress).expandedAddress
    });
  }
});

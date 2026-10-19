import { describe, expect, it } from 'vitest';
import { calculateSubnet } from './model';
describe('IPv4 subnet boundaries', () => {
  const masks = [
    '0.0.0.0',
    '128.0.0.0',
    '192.0.0.0',
    '224.0.0.0',
    '240.0.0.0',
    '248.0.0.0',
    '252.0.0.0',
    '254.0.0.0',
    '255.0.0.0',
    '255.128.0.0',
    '255.192.0.0',
    '255.224.0.0',
    '255.240.0.0',
    '255.248.0.0',
    '255.252.0.0',
    '255.254.0.0',
    '255.255.0.0',
    '255.255.128.0',
    '255.255.192.0',
    '255.255.224.0',
    '255.255.240.0',
    '255.255.248.0',
    '255.255.252.0',
    '255.255.254.0',
    '255.255.255.0',
    '255.255.255.128',
    '255.255.255.192',
    '255.255.255.224',
    '255.255.255.240',
    '255.255.255.248',
    '255.255.255.252',
    '255.255.255.254',
    '255.255.255.255'
  ];
  it.each(masks.map((mask, prefix) => ({ mask, prefix })))(
    'matches prefix $prefix with literal dotted mask $mask',
    ({ mask, prefix }) => {
      const result = calculateSubnet('203.0.113.140', String(prefix));
      expect(result).toMatchObject({
        kind: 'success',
        value: { mask, prefix }
      });
      expect(calculateSubnet('203.0.113.140', mask)).toEqual(result);
      expect(calculateSubnet(`203.0.113.140/${prefix}`, 'inactive')).toEqual(
        result
      );
    }
  );
  it('calculates a conventional /24 without signed address values', () => {
    expect(calculateSubnet('192.168.1.130', '/24')).toMatchObject({
      kind: 'success',
      value: {
        network: '192.168.1.0',
        broadcast: '192.168.1.255',
        firstHost: '192.168.1.1',
        lastHost: '192.168.1.254',
        totalAddresses: 256,
        hostCount: 254,
        mask: '255.255.255.0',
        wildcard: '0.0.0.255'
      }
    });
  });
  it('uses both addresses on a /31 point-to-point link without directed broadcast', () => {
    expect(calculateSubnet('192.0.2.11/31', '')).toMatchObject({
      kind: 'success',
      value: {
        network: '192.0.2.10',
        broadcast: null,
        firstHost: '192.0.2.10',
        lastHost: '192.0.2.11',
        hostCount: 2,
        totalAddresses: 2
      }
    });
  });
  it('handles the entire /0 space without enumeration or signed overflow', () => {
    expect(calculateSubnet('255.255.255.255/0', '')).toEqual({
      kind: 'success',
      value: {
        address: '255.255.255.255',
        prefix: 0,
        cidr: '0.0.0.0/0',
        network: '0.0.0.0',
        mask: '0.0.0.0',
        wildcard: '255.255.255.255',
        lastAddress: '255.255.255.255',
        broadcast: '255.255.255.255',
        firstHost: '0.0.0.1',
        lastHost: '255.255.255.254',
        totalAddresses: 4294967296,
        hostCount: 4294967294
      }
    });
  });
  it.each(['0.0.0.0', '255.255.255.255', '203.0.113.9'])(
    'keeps %s as one /32 host route',
    (address) => {
      expect(calculateSubnet(`${address}/32`, '')).toMatchObject({
        kind: 'success',
        value: {
          address,
          network: address,
          cidr: `${address}/32`,
          mask: '255.255.255.255',
          wildcard: '0.0.0.0',
          lastAddress: address,
          broadcast: null,
          firstHost: address,
          lastHost: address,
          totalAddresses: 1,
          hostCount: 1
        }
      });
    }
  );
  it.each([
    [
      '128.0.0.1/1',
      '128.0.0.0',
      '255.255.255.255',
      '128.0.0.1',
      '255.255.255.254',
      2147483648,
      2147483646
    ],
    [
      '192.0.2.129/25',
      '192.0.2.128',
      '192.0.2.255',
      '192.0.2.129',
      '192.0.2.254',
      128,
      126
    ],
    [
      '10.2.3.4/20',
      '10.2.0.0',
      '10.2.15.255',
      '10.2.0.1',
      '10.2.15.254',
      4096,
      4094
    ],
    [
      '172.16.5.99/30',
      '172.16.5.96',
      '172.16.5.99',
      '172.16.5.97',
      '172.16.5.98',
      4,
      2
    ]
  ] as const)(
    'calculates %s with literal network bounds',
    (
      address,
      network,
      broadcast,
      firstHost,
      lastHost,
      totalAddresses,
      hostCount
    ) => {
      expect(calculateSubnet(address, '')).toMatchObject({
        kind: 'success',
        value: {
          network,
          broadcast,
          firstHost,
          lastHost,
          totalAddresses,
          hostCount
        }
      });
    }
  );
  it('keeps the highest /31 endpoints unsigned', () => {
    expect(calculateSubnet('255.255.255.255/31', '')).toMatchObject({
      kind: 'success',
      value: {
        network: '255.255.255.254',
        firstHost: '255.255.255.254',
        lastHost: '255.255.255.255',
        broadcast: null,
        hostCount: 2
      }
    });
  });
  it.each([
    '256.0.0.1',
    '-1.0.0.0',
    '1.2.3',
    '1.2.3.4.5',
    '01.2.3.4',
    '1.2.3.004',
    '0x7f.0.0.1',
    '1e2.0.0.1',
    'localhost',
    '::1',
    '2001:db8::1',
    '1. 2.3.4',
    '1.2.3.4/33',
    '1.2.3.4/-1',
    '1.2.3.4/00',
    '1.2.3.4/24/25',
    '1.2.3.4/',
    '1.2.3.4/ 24',
    '1.2.3.4/255.255.255.0',
    '<script>1.2.3.4</script>'
  ])('rejects malformed address %s', (address) => {
    expect(calculateSubnet(address, '24')).toMatchObject({
      kind: 'error',
      field: 'address'
    });
  });
  it.each([
    '255.255.0.255',
    '255.255.255.1',
    '255.0.255.0',
    '0.0.0.1',
    '128.128.0.0',
    '0.255.255.255',
    '/33',
    '-1',
    '+24',
    '00',
    '/024',
    '24.0',
    '0xffffff00',
    '/24/25',
    '255.255.255.256',
    '0255.255.255.0',
    '__proto__'
  ])('rejects invalid prefix or mask %s', (mask) => {
    expect(calculateSubnet('192.0.2.1', mask)).toMatchObject({
      kind: 'error',
      field: 'subnet'
    });
  });
  it('handles blank input, raw length limits and surrounding whitespace', () => {
    expect(calculateSubnet(' ', '/24')).toEqual({ kind: 'incomplete' });
    expect(calculateSubnet('192.0.2.1', ' ')).toEqual({ kind: 'incomplete' });
    expect(calculateSubnet(' 192.0.2.1/24 ', 'inactive')).toEqual(
      calculateSubnet('192.0.2.1', ' 255.255.255.0 ')
    );
    expect(calculateSubnet('1.2.3.4'.padEnd(64), '/24').kind).toBe('success');
    expect(calculateSubnet('1.2.3.4'.padEnd(65), '/24')).toMatchObject({
      kind: 'error',
      field: 'address'
    });
    expect(calculateSubnet('1.2.3.4', '/24'.padEnd(64)).kind).toBe('success');
    expect(calculateSubnet('1.2.3.4', '/24'.padEnd(65))).toMatchObject({
      kind: 'error',
      field: 'subnet'
    });
    expect(calculateSubnet('1.2.3.4/24', 'x'.repeat(100))).toEqual(
      calculateSubnet('1.2.3.4/24', '')
    );
  });
});

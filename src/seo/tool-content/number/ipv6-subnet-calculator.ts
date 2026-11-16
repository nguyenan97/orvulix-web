import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'IPv6 Subnet Calculator - CIDR and Address Ranges | Orvulix',
  description:
    'Calculate IPv6 CIDR, first and last addresses and exact address counts. Accept full, compressed or IPv4-tail IPv6 input with prefixes from 0 to 128.',
  howTo: [
    'Enter an IPv6 address or CIDR such as 2001:db8:abcd:1234::1/64. Full and compressed addresses are accepted.',
    'For an address without a CIDR suffix, enter a separate prefix from 0 to 128. The suffix disables the separate field when present.',
    'Read the normalized hexadecimal address, expanded address, network CIDR, range boundaries and exact decimal count.',
    'Correct invalid input to restore results, or choose Reset calculator to clear the address and restore prefix /64.'
  ],
  examples: [
    {
      title: 'An IPv6 /64 range',
      description:
        '2001:db8:abcd:1234::1/64 gives network 2001:db8:abcd:1234::/64 and 18446744073709551616 addresses.'
    }
  ],
  notes: [
    'Arithmetic runs in this browser without DNS, network probes, host enumeration or automatic saving. Counts remain exact even for /0.',
    'IPv6 has no broadcast address. Counts include all addresses in the range, not a usable-host estimate. Special-use addresses and provider or interface allocation policies are not checked.',
    'Inputs are capped at 80 characters before trimming. Zones, brackets, ports, URLs and plain IPv4 are rejected. A dotted IPv4 tail within IPv6 is accepted with strict decimal octets.',
    'Output uses lowercase hexadecimal and compresses the leftmost longest run of two or more zero groups. Dotted IPv4 tails are also displayed in hexadecimal; no address-type classification is performed.'
  ]
};
export default content;

import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'IPv4 Subnet Calculator - CIDR, Mask and Host Range | Orvulix',
  description:
    'Calculate IPv4 network boundaries, subnet and wildcard masks, broadcast, host ranges and counts from CIDR or a dotted subnet mask in your browser.',
  howTo: [
    'Enter an IPv4 address, or paste an address with a CIDR suffix such as 192.168.1.130/24.',
    'For a plain address, enter prefix 0-32, /24 or a contiguous dotted subnet mask. A CIDR suffix disables the separate mask field.',
    'Read the network CIDR, masks, last address, directed broadcast and host range. Invalid input removes the previous results.',
    'Check the /31 point-to-point or /32 host-route explanation when applicable, or use Reset calculator to start again.'
  ],
  examples: [
    {
      title: 'A conventional /24 subnet',
      description:
        '192.168.1.130/24 gives network 192.168.1.0, directed broadcast 192.168.1.255 and 254 host slots from 192.168.1.1 to 192.168.1.254.'
    },
    {
      title: 'A point-to-point /31',
      description:
        '192.0.2.11/31 gives endpoints 192.0.2.10 and 192.0.2.11 using RFC 3021 point-to-point semantics, without a directed broadcast.'
    }
  ],
  notes: [
    'Subnet arithmetic runs in this browser without DNS queries, network probes, automatic saving or a remote calculator API.',
    'IPv4 only. Four decimal octets from 0 to 255 are required; leading zeros, hexadecimal, octal and IPv6 are rejected. Inputs are capped at 64 characters before trimming.',
    'For /0 through /30, host slots exclude network and directed broadcast. /31 uses two point-to-point endpoints; /32 is a single host route. /31 is not a universal interface convention.',
    'Counts are mathematical capacity without special-use or reserved-address filtering. They do not establish address availability, assignability or routability. Hosts are not enumerated, including for /0.'
  ]
};
export default content;

import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'Data Transfer Time Calculator - Bits and Bytes | Orvulix',
  description:
    'Estimate download or upload duration from data size, transfer rate and efficiency. Choose decimal or binary bit and byte units with explicit conversions.',
  howTo: [
    'Enter a data size and choose its bit or byte unit.',
    'Enter a positive transfer rate and choose the unit per second. Mb/s and MB/s are different.',
    'Optionally enter usable bandwidth efficiency between greater than 0 and 100 percent; blank means 100 percent.',
    'Read the live estimated time, decimal seconds and effective bit rate. Invalid input clears the previous estimate.'
  ],
  examples: [
    {
      title: 'A decimal gigabyte over 100 Mbps',
      description:
        '1 GB at 100 Mb/s takes 80 seconds at 100% efficiency, or 100 seconds at 80% efficiency.'
    },
    {
      title: 'A binary gigabyte over a byte rate',
      description:
        '1 GiB at 100 MiB/s takes 10.24 seconds. The whole-second duration rounds up to 11 seconds.'
    }
  ],
  notes: [
    'Arithmetic runs in this browser without a speed test, file reading, remote calculator API or automatic input saving. It does not measure actual network throughput.',
    'One byte equals 8 bits; decimal prefixes use powers of 1000 and binary prefixes use powers of 1024. Efficiency reduces the nominal rate before time is calculated.',
    'Values use JavaScript floating-point arithmetic. Results are approximate and assume a constant rate, without simulating latency, retransmissions or protocol behavior.',
    'Each numeric field is limited to 32 decimal-notation characters. Data size and rate are at most 10^15 in the selected unit; rate must be positive. Efficiency must be greater than 0 and at most 100%. Durations above Number.MAX_SAFE_INTEGER seconds are rejected.'
  ]
};
export default content;

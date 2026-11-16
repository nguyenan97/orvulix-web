import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { calculateSubnet } from './model';

export default function Calculator() {
  const [address, setAddress] = useState('');
  const [prefix, setPrefix] = useState('/64');
  const cidrInput = address.includes('/');
  const result = calculateSubnet(address, prefix);
  const subnet = result.kind === 'success' ? result.value : null;
  const rows = subnet
    ? [
        ['Normalized address', subnet.address],
        ['Expanded address', subnet.expandedAddress],
        ['Network CIDR', subnet.cidr],
        ['Prefix length', `/${subnet.prefix}`],
        ['First address', subnet.firstAddress],
        ['Last address', subnet.lastAddress],
        ['Total addresses', subnet.totalAddresses]
      ]
    : [];
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Typography>
        Calculate IPv6 network boundaries and exact address counts. Paste CIDR,
        or enter an IPv6 address and a separate prefix. Calculations run in your
        browser without DNS queries or network probes.
      </Typography>
      <TextField
        label="IPv6 address or CIDR"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        fullWidth
        inputProps={{
          maxLength: 80,
          spellCheck: false,
          autoCapitalize: 'none'
        }}
        error={result.kind === 'error' && result.field === 'address'}
        helperText={
          result.kind === 'error' && result.field === 'address'
            ? result.message
            : 'Example: 2001:db8:abcd:1234::1/64. IPv4 tails are accepted; zones and brackets are not.'
        }
      />
      <TextField
        label="IPv6 prefix length"
        value={cidrInput ? address.trim().split('/')[1] ?? '' : prefix}
        disabled={cidrInput}
        fullWidth
        onChange={(event) => setPrefix(event.target.value)}
        inputProps={{ maxLength: 80, spellCheck: false }}
        error={result.kind === 'error' && result.field === 'prefix'}
        helperText={
          cidrInput
            ? 'The CIDR suffix controls the prefix. Remove /prefix from the address to edit this field.'
            : result.kind === 'error' && result.field === 'prefix'
              ? result.message
              : 'Enter 0-128 or /64. Default: /64.'
        }
      />
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button
          onClick={() => {
            setAddress('2001:db8:abcd:1234::1');
            setPrefix('/64');
          }}
        >
          Load example
        </Button>
        <Button
          onClick={() => {
            setAddress('');
            setPrefix('/64');
          }}
        >
          Reset calculator
        </Button>
      </Stack>
      {result.kind === 'incomplete' && (
        <Typography role="status">
          Enter an IPv6 address and prefix length.
        </Typography>
      )}
      {subnet && (
        <Stack component="section" aria-label="IPv6 subnet results" spacing={2}>
          <Typography component="h2" variant="h6">
            IPv6 subnet details
          </Typography>
          <Typography role="status" sx={{ overflowWrap: 'anywhere' }}>
            Subnet calculated: {subnet.cidr}.
          </Typography>
          <Stack component="dl" spacing={2} sx={{ m: 0 }}>
            {rows.map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
                  gap: 0.5
                }}
              >
                <Typography component="dt" color="text.secondary">
                  {label}
                </Typography>
                <Typography
                  component="dd"
                  sx={{ m: 0, overflowWrap: 'anywhere' }}
                  data-testid={`ipv6-${label
                    .toLowerCase()
                    .replaceAll(' ', '-')}`}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      )}
      <Typography variant="body2" color="text.secondary">
        IPv6 has no broadcast address. Counts include every address in the
        range, without subtracting network or last addresses. This is
        mathematical capacity, not usable-host availability or a
        routing/allocation policy check. Output uses lowercase compressed
        hexadecimal, including dotted IPv4 tails. Addresses are never
        enumerated. Nothing is saved automatically.
      </Typography>
    </Stack>
  );
}

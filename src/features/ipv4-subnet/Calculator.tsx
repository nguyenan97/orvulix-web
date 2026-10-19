import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { calculateSubnet } from './model';
const number = (value: number) => new Intl.NumberFormat('en-US').format(value);
export default function Calculator() {
  const [address, setAddress] = useState('');
  const [mask, setMask] = useState('/24');
  const cidrInput = address.includes('/');
  const result = calculateSubnet(address, mask);
  const subnet = result.kind === 'success' ? result.value : null;
  const rows = subnet
    ? [
        ['Input address', subnet.address],
        ['Network CIDR', subnet.cidr],
        ['Network address', subnet.network],
        ['Prefix length', `/${subnet.prefix}`],
        ['Subnet mask', subnet.mask],
        ['Wildcard mask', subnet.wildcard],
        ['Last address', subnet.lastAddress],
        [
          'Directed broadcast',
          subnet.broadcast ??
            (subnet.prefix === 31
              ? 'Not used for /31 point-to-point links'
              : 'No distinct broadcast for a /32 host route')
        ],
        ['Host range', `${subnet.firstHost} to ${subnet.lastHost}`],
        ['Total addresses', number(subnet.totalAddresses)],
        ['Host slots', number(subnet.hostCount)]
      ]
    : [];
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Typography>
        Calculate IPv4 subnet boundaries from an address and prefix or mask.
        Paste CIDR directly, or enter an address and use the separate subnet
        field. This tool performs arithmetic without DNS or network probes.
      </Typography>
      <TextField
        label="IPv4 address or CIDR"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        fullWidth
        inputProps={{
          maxLength: 64,
          spellCheck: false,
          autoCapitalize: 'none'
        }}
        error={result.kind === 'error' && result.field === 'address'}
        helperText={
          result.kind === 'error' && result.field === 'address'
            ? result.message
            : 'Example: 192.168.1.130 or 192.168.1.130/24. No leading zeros.'
        }
      />
      <TextField
        label="Prefix length or subnet mask"
        value={cidrInput ? address.trim().split('/')[1] ?? '' : mask}
        disabled={cidrInput}
        onChange={(event) => setMask(event.target.value)}
        fullWidth
        inputProps={{ maxLength: 64, spellCheck: false }}
        error={result.kind === 'error' && result.field === 'subnet'}
        helperText={
          cidrInput
            ? 'The CIDR suffix controls the subnet. Remove /prefix from the address to edit this field.'
            : result.kind === 'error' && result.field === 'subnet'
              ? result.message
              : 'Enter 0-32, /24 or a contiguous dotted mask such as 255.255.255.0.'
        }
      />
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button
          onClick={() => {
            setAddress('192.168.1.130');
            setMask('/24');
          }}
        >
          Load example
        </Button>
        <Button
          onClick={() => {
            setAddress('');
            setMask('/24');
          }}
        >
          Reset calculator
        </Button>
      </Stack>
      {result.kind === 'incomplete' && (
        <Typography role="status">
          Enter an IPv4 address and a prefix or subnet mask.
        </Typography>
      )}
      {subnet && (
        <Stack component="section" aria-label="Subnet results" spacing={2}>
          <Typography component="h2" variant="h6">
            Subnet details
          </Typography>
          <Typography role="status">
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
                  data-testid={`subnet-${label
                    .toLowerCase()
                    .replaceAll(' ', '-')}`}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>
          {subnet.prefix === 31 && (
            <Alert severity="info">
              /31 uses RFC 3021 point-to-point semantics: both addresses are
              endpoints, with no directed broadcast. This convention does not
              apply to every interface type.
            </Alert>
          )}
          {subnet.prefix === 32 && (
            <Alert severity="info">
              /32 describes one host route. Its only address is the host; there
              is no distinct directed broadcast.
            </Alert>
          )}
        </Stack>
      )}
      <Typography variant="body2" color="text.secondary">
        For /0 through /30, host slots exclude network and directed broadcast.
        Counts are mathematical capacity: reserved and special-use addresses are
        not filtered. Results do not establish whether an address is assignable
        or routable. IPv6 and host enumeration are outside this tool. Nothing is
        saved automatically.
      </Typography>
    </Stack>
  );
}

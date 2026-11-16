import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import Calculator from './Calculator';
afterEach(cleanup);
const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
it('shows only current valid IPv6 results, recovers and resets', () => {
  render(<Calculator />);
  expect(
    screen.queryByRole('region', { name: 'IPv6 subnet results' })
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
  expect(screen.getByTestId('ipv6-total-addresses')).toHaveTextContent(
    '18446744073709551616'
  );
  fill('IPv6 address or CIDR', '::1::');
  expect(screen.getByLabelText('IPv6 address or CIDR')).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  expect(
    screen.queryByRole('region', { name: 'IPv6 subnet results' })
  ).toBeNull();
  fill('IPv6 address or CIDR', '::ffff:192.0.2.1');
  expect(screen.getByTestId('ipv6-normalized-address')).toHaveTextContent(
    '::ffff:c000:201'
  );
  fill('IPv6 prefix length', '/129');
  expect(
    screen.queryByRole('region', { name: 'IPv6 subnet results' })
  ).toBeNull();
  expect(screen.getByLabelText('IPv6 prefix length')).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  fill('IPv6 prefix length', '128');
  expect(screen.getByTestId('ipv6-total-addresses')).toHaveTextContent('1');
  fireEvent.click(screen.getByRole('button', { name: 'Reset calculator' }));
  expect(screen.getByLabelText('IPv6 address or CIDR')).toHaveValue('');
  expect(screen.getByLabelText('IPv6 prefix length')).toHaveValue('/64');
  expect(
    screen.queryByRole('region', { name: 'IPv6 subnet results' })
  ).toBeNull();
});
it('makes CIDR ownership visible and restores manual prefix after suffix removal', () => {
  render(<Calculator />);
  fill('IPv6 prefix length', '/48');
  fill('IPv6 address or CIDR', '2001:db8:abcd:1234::1/64');
  expect(screen.getByLabelText('IPv6 prefix length')).toBeDisabled();
  expect(screen.getByLabelText('IPv6 prefix length')).toHaveValue('64');
  expect(screen.getByTestId('ipv6-network-cidr')).toHaveTextContent(
    '2001:db8:abcd:1234::/64'
  );
  fill('IPv6 address or CIDR', '2001:db8:abcd:1234::1/129');
  expect(
    screen.queryByRole('region', { name: 'IPv6 subnet results' })
  ).toBeNull();
  fill('IPv6 address or CIDR', '2001:db8:abcd:1234::1');
  expect(screen.getByLabelText('IPv6 prefix length')).toBeEnabled();
  expect(screen.getByLabelText('IPv6 prefix length')).toHaveValue('/48');
  expect(screen.getByTestId('ipv6-network-cidr')).toHaveTextContent(
    '2001:db8:abcd::/48'
  );
  fill('IPv6 prefix length', '');
  expect(
    screen.queryByRole('region', { name: 'IPv6 subnet results' })
  ).toBeNull();
});

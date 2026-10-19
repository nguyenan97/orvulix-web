import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Calculator from './Calculator';
afterEach(cleanup);
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
describe('current IPv4 subnet UI', () => {
  it('derives only current results and recovers from invalid address or mask', () => {
    render(<Calculator />);
    expect(
      screen.queryByRole('region', { name: 'Subnet results' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    expect(screen.getByTestId('subnet-network-address')).toHaveTextContent(
      '192.168.1.0'
    );
    expect(screen.getByTestId('subnet-host-slots')).toHaveTextContent('254');
    fill('IPv4 address or CIDR', '256.0.0.1');
    expect(screen.getByLabelText('IPv4 address or CIDR')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(
      screen.queryByRole('region', { name: 'Subnet results' })
    ).not.toBeInTheDocument();
    fill('IPv4 address or CIDR', '192.0.2.129');
    fill('Prefix length or subnet mask', '255.255.255.0');
    expect(screen.getByTestId('subnet-network-cidr')).toHaveTextContent(
      '192.0.2.0/24'
    );
    fill('Prefix length or subnet mask', '255.0.255.0');
    expect(
      screen.queryByRole('region', { name: 'Subnet results' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Prefix length or subnet mask')
    ).toHaveAttribute('aria-invalid', 'true');
    fill('Prefix length or subnet mask', '/25');
    expect(screen.getByTestId('subnet-network-cidr')).toHaveTextContent(
      '192.0.2.128/25'
    );
    fill('Prefix length or subnet mask', '');
    expect(
      screen.queryByRole('region', { name: 'Subnet results' })
    ).not.toBeInTheDocument();
  });
  it('makes CIDR ownership visible and restores the manual prefix after removing it', () => {
    render(<Calculator />);
    fill('Prefix length or subnet mask', '/20');
    fill('IPv4 address or CIDR', '192.0.2.11/31');
    expect(
      screen.getByLabelText('Prefix length or subnet mask')
    ).toBeDisabled();
    expect(screen.getByLabelText('Prefix length or subnet mask')).toHaveValue(
      '31'
    );
    expect(screen.getByTestId('subnet-host-range')).toHaveTextContent(
      '192.0.2.10 to 192.0.2.11'
    );
    expect(
      screen.getByText(/both addresses are endpoints/)
    ).toBeInTheDocument();
    fill('IPv4 address or CIDR', '192.0.2.11/33');
    expect(
      screen.queryByRole('region', { name: 'Subnet results' })
    ).not.toBeInTheDocument();
    fill('IPv4 address or CIDR', '192.0.2.11');
    expect(
      screen.getByLabelText('Prefix length or subnet mask')
    ).not.toBeDisabled();
    expect(screen.getByLabelText('Prefix length or subnet mask')).toHaveValue(
      '/20'
    );
    expect(screen.getByTestId('subnet-network-cidr')).toHaveTextContent(
      '192.0.0.0/20'
    );
  });
  it('shows /0 and /32 without enumerating hosts and clears on Reset', () => {
    render(<Calculator />);
    fill('IPv4 address or CIDR', '255.255.255.255/0');
    expect(screen.getByTestId('subnet-total-addresses')).toHaveTextContent(
      '4,294,967,296'
    );
    fill('IPv4 address or CIDR', '255.255.255.255/32');
    expect(screen.getByTestId('subnet-host-slots')).toHaveTextContent('1');
    expect(screen.getByTestId('subnet-host-range')).toHaveTextContent(
      '255.255.255.255 to 255.255.255.255'
    );
    expect(screen.getByText(/one host route/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset calculator' }));
    expect(screen.getByLabelText('IPv4 address or CIDR')).toHaveValue('');
    expect(screen.getByLabelText('Prefix length or subnet mask')).toHaveValue(
      '/24'
    );
    expect(
      screen.queryByRole('region', { name: 'Subnet results' })
    ).not.toBeInTheDocument();
  });
});

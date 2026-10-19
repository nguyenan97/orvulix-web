import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Calculator from './Calculator';
afterEach(cleanup);
const field = (label: string) => screen.getByLabelText(label);
function fill(label: string, value: string) {
  fireEvent.change(field(label), { target: { value } });
}
describe('live transfer estimate', () => {
  it('loads the worked example and derives fresh output from each edit', () => {
    render(<Calculator />);
    expect(
      screen.queryByRole('region', { name: 'Transfer estimate' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    expect(screen.getByTestId('transfer-duration')).toHaveTextContent(
      '1 min 40 s'
    );
    fill('Efficiency (%)', '');
    expect(screen.getByTestId('transfer-seconds')).toHaveTextContent(
      'Approximately 80 seconds'
    );
    fill('Data size', '2');
    expect(screen.getByTestId('transfer-seconds')).toHaveTextContent(
      'Approximately 160 seconds'
    );
    fill('Transfer rate', '0');
    expect(field('Transfer rate')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
    fill('Transfer rate', '100');
    expect(screen.getByTestId('transfer-duration')).toHaveTextContent(
      '2 min 40 s'
    );
    fill('Data size', '');
    expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Enter a data size');
  });
  it('changes unit semantics immediately and handles subsecond and zero transfers', () => {
    render(<Calculator />);
    fill('Data size', '1');
    fill('Transfer rate', '100');
    fireEvent.mouseDown(field('Data size unit'));
    fireEvent.click(screen.getByRole('option', { name: 'B (bytes)' }));
    expect(screen.getByTestId('transfer-duration')).toHaveTextContent(
      'Less than 1 s'
    );
    fill('Data size', '0');
    expect(screen.getByTestId('transfer-duration')).toHaveTextContent('0 s');
    fill('Efficiency (%)', '101');
    expect(field('Efficiency (%)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset calculator' }));
    expect(field('Data size')).toHaveValue('');
    expect(field('Efficiency (%)')).toHaveValue('');
    expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
  });
  it('shows field errors for malformed input and recovers without stale results', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    for (const bad of ['-1', 'NaN', 'Infinity', '1e3', '1,000', 'oops']) {
      fill('Data size', bad);
      expect(field('Data size')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.queryByTestId('transfer-duration')).not.toBeInTheDocument();
    }
    fill('Data size', '1');
    expect(screen.getByTestId('transfer-seconds')).toHaveTextContent(
      '100 seconds'
    );
  });
});

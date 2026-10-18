import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import NumericInputWithUnit from './NumericInputWithUnit';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));
afterEach(cleanup);

it('keeps the selected display unit across updates and resets on quantity-kind change', () => {
  const onOwnChange = vi.fn();
  const { rerender } = render(
    <NumericInputWithUnit
      value={{ value: 1, unit: 'm' }}
      onOwnChange={onOwnChange}
    />
  );
  fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
  fireEvent.click(screen.getByRole('option', { name: /^foot$/ }));
  expect(
    Number((screen.getByRole('spinbutton') as HTMLInputElement).value)
  ).toBeCloseTo(3.28084, 5);
  rerender(
    <NumericInputWithUnit
      value={{ value: 2, unit: 'm' }}
      onOwnChange={onOwnChange}
    />
  );
  expect(
    Number((screen.getByRole('spinbutton') as HTMLInputElement).value)
  ).toBeCloseTo(6.56168, 5);
  expect(onOwnChange).not.toHaveBeenCalled();
  rerender(
    <NumericInputWithUnit
      value={{ value: 5, unit: 's' }}
      onOwnChange={onOwnChange}
    />
  );
  expect(
    Number((screen.getByRole('spinbutton') as HTMLInputElement).value)
  ).toBe(5);
  expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('s');
});

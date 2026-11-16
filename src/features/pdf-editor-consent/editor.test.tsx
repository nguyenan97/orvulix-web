import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import PdfEditor from '../../pages/tools/pdf/editor';
import { PDF_EDITOR_URL } from './ExternalPdfEditor';
// Isolate shared layout only; exercise the actual page adapter and native frame.
vi.mock('../../components/ToolContent', () => ({
  default: ({ inputComponent }: { inputComponent: ReactNode }) => (
    <div>{inputComponent}</div>
  )
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function view() {
  return render(
    <MemoryRouter>
      <PdfEditor title="PDF Editor" />
    </MemoryRouter>
  );
}
it('does not create an external PDF iframe before explicit opt-in', () => {
  const { container } = view();
  expect(container.querySelector('iframe')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Enable SimplePDF editor' })
  ).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByText(/document fingerprint/)).toBeVisible();
});
it('gates the same empty inline URL, with a frame title and no document/query data', () => {
  const { container } = view();
  fireEvent.click(
    screen.getByRole('button', { name: 'Enable SimplePDF editor' })
  );
  const frame = screen.getByTitle('SimplePDF editor (external service)');
  expect(frame).toHaveAttribute('src', PDF_EDITOR_URL);
  expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(new URL(frame.getAttribute('src')!).search).toBe('');
  const control = screen.getByRole('button', {
    name: 'Close SimplePDF editor'
  });
  expect(control).toHaveAttribute('aria-expanded', 'true');
  expect(
    container.querySelector(
      '[id="' + control.getAttribute('aria-controls') + '"]'
    )
  ).toContainElement(frame);
});
it('closes the frame and enables a fresh instance without losing the control', () => {
  view();
  const button = screen.getByRole('button', {
    name: 'Enable SimplePDF editor'
  });
  fireEvent.click(button);
  const first = screen.getByTitle('SimplePDF editor (external service)');
  fireEvent.click(button);
  expect(first).not.toBeInTheDocument();
  expect(button).toHaveAccessibleName('Enable SimplePDF editor');
  fireEvent.click(button);
  expect(screen.getByTitle('SimplePDF editor (external service)')).not.toBe(
    first
  );
});
it('unmount destroys the frame and a new visit defaults off', () => {
  const first = view();
  fireEvent.click(
    screen.getByRole('button', { name: 'Enable SimplePDF editor' })
  );
  const frame = screen.getByTitle('SimplePDF editor (external service)');
  first.unmount();
  expect(frame).not.toBeInTheDocument();
  const next = view();
  expect(next.container.querySelector('iframe')).toBeNull();
});
it('writes no consent, file or identifier to browser storage', () => {
  const local = vi.spyOn(Storage.prototype, 'setItem');
  view();
  fireEvent.click(
    screen.getByRole('button', { name: 'Enable SimplePDF editor' })
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Close SimplePDF editor' })
  );
  expect(local).not.toHaveBeenCalled();
});
it('offers the actual provider privacy policy and a base-path-aware PDF alternative', () => {
  view();
  const policy = screen.getByRole('link', { name: 'SimplePDF privacy policy' });
  expect(policy).toHaveAttribute('href', 'https://simplepdf.com/privacy');
  expect(policy).toHaveAttribute('rel', 'noopener noreferrer');
  expect(
    screen.getByRole('link', { name: 'Browse other PDF tools' })
  ).toHaveAttribute('href', '/categories/pdf');
});

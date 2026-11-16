import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FrameOrder } from './FrameOrder';
import type { MultiImageInput } from '../../components/input/ToolMultipleImageInput';
import video from '../../../public/locales/en/video.json';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values: Record<string, unknown> = {}) => {
      const text =
        video.gif.imagesToGif[
          key.split('.').at(-1)! as keyof typeof video.gif.imagesToGif
        ];
      return text.replace(/{{(\w+)}}/g, (_, name: string) =>
        String(values[name])
      );
    }
  })
}));
afterEach(cleanup);
const selected = () => {
  const file = new File(['x'], 'same.png', { type: 'image/png' });
  return [5, 9, 12].map((order) => ({ file, order, preview: `blob:${order}` }));
};
it('moves duplicate names by position, retains frame objects and focuses the moved item', () => {
  const original = selected();
  const changed = vi.fn();
  function Host() {
    const [frames, setFrames] = useState<MultiImageInput[]>(original);
    return (
      <FrameOrder
        frames={frames}
        onChange={(next) => {
          changed(next);
          setFrames(next);
        }}
      />
    );
  }
  render(<Host />);
  expect(
    screen.getByRole('button', { name: 'Move frame 1 earlier: same.png' })
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Move frame 3 later: same.png' })
  ).toBeDisabled();
  const earlier = screen.getByRole('button', {
    name: 'Move frame 2 earlier: same.png'
  });
  earlier.focus();
  fireEvent.click(earlier);
  expect(changed.mock.calls[0][0]).toEqual([
    original[1],
    original[0],
    original[2]
  ]);
  expect(changed.mock.calls[0][0][0]).toBe(original[1]);
  expect(
    screen.getByRole('listitem', { name: 'Frame 1: same.png' })
  ).toHaveFocus();
  fireEvent.click(
    screen.getByRole('button', { name: 'Move frame 1 later: same.png' })
  );
  expect(changed.mock.calls[1][0]).toEqual(original);
  expect(
    screen.getByRole('listitem', { name: 'Frame 2: same.png' })
  ).toHaveFocus();
  expect(original.map((item) => item.order)).toEqual([5, 9, 12]);
});
it('renders no controls for empty input and cannot move a single frame', () => {
  const changed = vi.fn();
  const { rerender } = render(<FrameOrder frames={[]} onChange={changed} />);
  expect(screen.queryByRole('list')).toBeNull();
  rerender(<FrameOrder frames={selected().slice(0, 1)} onChange={changed} />);
  for (const button of screen.getAllByRole('button')) {
    expect(button).toBeDisabled();
    fireEvent.click(button);
  }
  expect(changed).not.toHaveBeenCalled();
});
it('clears old focus refs after external replacement/Clear and renders filenames as text', () => {
  function Host() {
    const [frames, setFrames] = useState<MultiImageInput[]>(selected());
    return (
      <>
        <FrameOrder frames={frames} onChange={setFrames} />
        <button onClick={() => setFrames([])}>Clear</button>
        <button
          onClick={() =>
            setFrames([
              { file: new File(['x'], '<img onerror=alert(1)>.png'), order: 0 }
            ])
          }
        >
          Replace
        </button>
      </>
    );
  }
  render(<Host />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Move frame 2 earlier: same.png' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  expect(screen.queryByRole('list')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Replace' }));
  expect(screen.getByText('<img onerror=alert(1)>.png')).toBeInTheDocument();
  expect(document.querySelector('img')).toBeNull();
});

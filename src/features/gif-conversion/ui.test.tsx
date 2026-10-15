import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ImagesToGif from '../../pages/tools/video/gif/images-to-gif';
import { imagesToGif } from '../../pages/tools/video/gif/images-to-gif/service';
import type { MultiImageInput } from '../../components/input/ToolMultipleImageInput';
vi.mock('../../pages/tools/video/gif/images-to-gif/service', () => ({
  imagesToGif: vi.fn()
}));
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key })
}));
// Keep application i18n network/bootstrap timers out of lifecycle fake-timer tests.
vi.mock('../../i18n', () => ({
  validNamespaces: [
    'string',
    'number',
    'video',
    'list',
    'json',
    'time',
    'csv',
    'pdf',
    'audio',
    'xml',
    'translation',
    'image',
    'converters'
  ]
}));
vi.mock('../../components/input/ToolMultipleImageInput', () => ({
  default: ({ onChange }: { onChange: (files: MultiImageInput[]) => void }) => (
    <>
      <button
        onClick={() =>
          onChange([
            {
              file: new File(['image'], 'a.png', { type: 'image/png' }),
              order: 0
            }
          ])
        }
      >
        Choose image
      </button>
      <button onClick={() => onChange([])}>Clear input</button>
    </>
  )
}));
beforeEach(() => {
  vi.useFakeTimers();
  let index = 0;
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => `blob:${++index}`);
      static revokeObjectURL = vi.fn();
    }
  );
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const output = () => new File(['gif'], 'animated.gif', { type: 'image/gif' });
const advance = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
it('clears current output immediately on file/options edits, and unchanged option clicks retain it', async () => {
  vi.mocked(imagesToGif).mockResolvedValue(output());
  render(<ImagesToGif title="GIF" />);
  fireEvent.click(screen.getByText('Choose image'));
  await advance();
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeEnabled();
  fireEvent.click(screen.getByText('gif.imagesToGif.frameRate'));
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeEnabled();
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '20' } });
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeDisabled();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
  await advance();
  expect(vi.mocked(imagesToGif).mock.calls.at(-1)![1].frameRateValue).toBe(20);
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeEnabled();
  fireEvent.click(screen.getByText('Clear input'));
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeDisabled();
});
it('ignores late active results after clear and aborts/debounces cleanup on unmount', async () => {
  const finishes: ((file: File) => void)[] = [];
  vi.mocked(imagesToGif).mockImplementation(
    () => new Promise((resolve) => finishes.push(resolve))
  );
  const { unmount } = render(<ImagesToGif title="GIF" />);
  fireEvent.click(screen.getByText('Choose image'));
  await advance();
  const signal = vi.mocked(imagesToGif).mock.calls[0][2]!;
  fireEvent.click(screen.getByText('Clear input'));
  expect(signal.aborted).toBe(true);
  await act(async () => {
    finishes[0](output());
  });
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeDisabled();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Choose image'));
  unmount();
  await advance();
  expect(imagesToGif).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
it('shows current errors without stale download and recovers with owned output URL cleanup', async () => {
  vi.mocked(imagesToGif)
    .mockRejectedValueOnce(Error('encoder failed'))
    .mockResolvedValueOnce(output());
  const { unmount } = render(<ImagesToGif title="GIF" />);
  fireEvent.click(screen.getByText('Choose image'));
  await advance();
  expect(screen.getByRole('alert')).toHaveTextContent('supported images');
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeDisabled();
  fireEvent.click(screen.getByText('Choose image'));
  await advance();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeEnabled();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
});

import { useState } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  act
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ImageInput from '../../components/input/ToolMultipleImageInput';
import AudioInput from '../../components/input/ToolMultipleAudioInput';
import VideoInput from '../../components/input/ToolMultipleVideoInput';
import PdfInput from '../../components/input/ToolMultiplePdfInput';
import { InputFile, FileKind } from './policy';
import { prepareFile } from './prepare';
vi.mock('./prepare', () => ({ prepareFile: vi.fn(async (file) => file) }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === 'string' ? fallback : key
  })
}));

function Host({ kind }: { kind: FileKind }) {
  const [value, setValue] = useState<InputFile[]>([]);
  const props = {
    value,
    onChange: setValue,
    accept: [kind === 'pdf' ? 'application/pdf' : `${kind}/*`]
  };
  const input =
    kind === 'image' ? (
      <ImageInput type="image" {...props} />
    ) : kind === 'audio' ? (
      <AudioInput type="audio" {...props} />
    ) : kind === 'video' ? (
      <VideoInput type="video" {...props} />
    ) : (
      <PdfInput type="pdf" {...props} />
    );
  return (
    <>
      {input}
      <button onClick={() => setValue([])}>External reset</button>
      <output>
        {value.map((item) => `${item.file.name}:${item.order}`).join(',')}
      </output>
    </>
  );
}
beforeEach(() => {
  vi.mocked(prepareFile).mockImplementation(async (file) => file);
  let i = 0;
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => `blob:${++i}`);
      static revokeObjectURL = vi.fn();
    }
  );
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
const transfer = (files: File[], types = ['Files']) => ({
  files,
  types,
  items: [],
  dropEffect: 'none'
});
it.each(['image', 'audio', 'video', 'pdf'] as const)(
  'uses one picker/drop contract in the actual %s adapter with accessible remove/clear',
  async (kind) => {
    const { container } = render(<Host kind={kind} />);
    const mime = kind === 'pdf' ? 'application/pdf' : `${kind}/test`;
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: { files: [new File(['a'], 'a', { type: mime })] }
    });
    await waitFor(() =>
      expect(container.querySelector('output')).toHaveTextContent('a:0')
    );
    fireEvent.drop(screen.getByRole('region'), {
      dataTransfer: transfer([new File(['b'], 'b', { type: mime })])
    });
    await waitFor(() =>
      expect(container.querySelector('output')).toHaveTextContent('a:0,b:1')
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: 'toolMultipleInput.deleteFile' })[0]
    );
    expect(container.querySelector('output')).toHaveTextContent('b:1');
    fireEvent.click(screen.getByRole('button', { name: 'inputFooter.clear' }));
    expect(container.querySelector('output')).toBeEmptyDOMElement();
  }
);
it('keeps overlay through nested file drag events, ignores text/URL drops and rejects directories', () => {
  render(<Host kind="image" />);
  const zone = screen.getByRole('region');
  const files = transfer([]);
  fireEvent.dragEnter(zone, { dataTransfer: files });
  fireEvent.dragEnter(zone.firstElementChild!, { dataTransfer: files });
  fireEvent.dragLeave(zone.firstElementChild!, { dataTransfer: files });
  expect(screen.getByText('Drop files to import')).toBeVisible();
  fireEvent.dragLeave(zone, { dataTransfer: files });
  expect(screen.queryByText('Drop files to import')).toBeNull();
  fireEvent.drop(zone, { dataTransfer: transfer([], ['text/uri-list']) });
  expect(prepareFile).not.toHaveBeenCalled();
  fireEvent.drop(zone, {
    dataTransfer: {
      ...files,
      items: [{ webkitGetAsEntry: () => ({ isDirectory: true }) }]
    }
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Directories');
});
it('rejects mixed batches without decoding, clears error on recovery and invalidates pending work on external reset/unmount', async () => {
  let finish!: (file: File) => void;
  vi.mocked(prepareFile).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const { container, unmount } = render(<Host kind="image" />);
  const zone = screen.getByRole('region');
  fireEvent.drop(zone, {
    dataTransfer: transfer([
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'bad.txt', { type: 'text/plain' })
    ])
  });
  await screen.findByRole('alert');
  expect(prepareFile).not.toHaveBeenCalled();
  fireEvent.drop(zone, {
    dataTransfer: transfer([new File(['a'], 'a.png', { type: 'image/png' })])
  });
  await waitFor(() => expect(prepareFile).toHaveBeenCalledOnce());
  const signal = vi.mocked(prepareFile).mock.calls[0][2];
  fireEvent.click(screen.getByText('External reset'));
  expect(signal.aborted).toBe(true);
  await act(async () =>
    finish(new File(['late'], 'late.png', { type: 'image/png' }))
  );
  expect(container.querySelector('output')).toBeEmptyDOMElement();
  expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.drop(zone, {
    dataTransfer: transfer([new File(['a'], 'a.png', { type: 'image/png' })])
  });
  await waitFor(() => expect(prepareFile).toHaveBeenCalledTimes(2));
  const unmountSignal = vi.mocked(prepareFile).mock.calls[1][2];
  unmount();
  expect(unmountSignal.aborted).toBe(true);
  await act(async () =>
    finish(new File(['late'], 'late.png', { type: 'image/png' }))
  );
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

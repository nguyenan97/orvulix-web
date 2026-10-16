import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ToolTextInput from '../../components/input/ToolTextInput';
import ToolCodeInput from '../../components/input/ToolCodeInput';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange
  }: {
    value: string;
    onChange: (s: string) => void;
  }) => (
    <textarea
      data-testid="code-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s })
}));
class Reader {
  static instances: Reader[] = [];
  readyState = 1;
  result: string | ArrayBuffer | null = null;
  onload: ((e: { target: Reader }) => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  abort = vi.fn(() => {
    this.readyState = 2;
    this.onabort?.();
  });
  readAsText = vi.fn();
  constructor() {
    Reader.instances.push(this);
  }
  complete(text: string) {
    this.result = text;
    this.readyState = 2;
    this.onload?.({ target: this });
  }
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reader.instances = [];
});
for (const kind of ['text', 'code'] as const)
  describe(`${kind} file import`, () => {
    function view() {
      vi.stubGlobal('FileReader', Reader);
      const change = vi.fn();
      const notice = vi.fn();
      const ui = (value = '') => (
        <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
          {kind === 'text' ? (
            <ToolTextInput value={value} onChange={change} />
          ) : (
            <ToolCodeInput value={value} onChange={change} language="json" />
          )}
        </CustomSnackBarContext.Provider>
      );
      const rendered = render(ui());
      const pick = () => {
        const input = rendered.container.querySelector('input[type=file]')!;
        fireEvent.change(input, {
          target: { files: [new File(['sample'], 'sample.txt')] }
        });
        return Reader.instances.at(-1)!;
      };
      return {
        ...rendered,
        change,
        notice,
        pick,
        update: (value: string) => rendered.rerender(ui(value))
      };
    }
    it('does not overwrite a later user edit with a pending file', () => {
      const v = view();
      const reader = v.pick();
      fireEvent.change(
        screen.getByTestId(kind === 'text' ? 'text-input' : 'code-input'),
        { target: { value: 'new edit' } }
      );
      act(() => reader.complete('stale file'));
      expect(v.change.mock.calls).toEqual([['new edit']]);
      expect(reader.abort).toHaveBeenCalledOnce();
    });
    it('only accepts the latest selected file, even with a queued old callback', () => {
      const v = view();
      const old = v.pick();
      const late = old.onload!;
      const current = v.pick();
      act(() => {
        current.complete('Việt Nam 😀\r\n literal\\n');
        old.result = 'old';
        late({ target: old });
      });
      expect(v.change.mock.calls).toEqual([['Việt Nam 😀\r\n literal\\n']]);
      expect(old.abort).toHaveBeenCalledOnce();
    });
    it('cancels on external value change and unmount', () => {
      const v = view();
      const old = v.pick();
      v.update('reset');
      act(() => old.complete('stale'));
      expect(v.change).not.toHaveBeenCalled();
      const next = v.pick();
      v.unmount();
      act(() => next.complete('unmounted'));
      expect(next.abort).toHaveBeenCalledOnce();
      expect(v.change).not.toHaveBeenCalled();
    });
    it('reports read errors without leaking file details and recovers with an empty file', () => {
      const v = view();
      const failed = v.pick();
      act(() => failed.onerror?.());
      expect(v.notice).toHaveBeenCalledWith(
        expect.stringContaining('try again'),
        'error'
      );
      const next = v.pick();
      act(() => next.complete(''));
      expect(v.change).toHaveBeenCalledExactlyOnceWith('');
    });
    it('handles constructor/read startup errors and detaches completed readers', () => {
      const v = view();
      vi.stubGlobal(
        'FileReader',
        class {
          constructor() {
            throw Error('private path');
          }
        }
      );
      fireEvent.change(v.container.querySelector('input[type=file]')!, {
        target: { files: [new File([''], 'x')] }
      });
      expect(v.notice).toHaveBeenCalledOnce();
      vi.stubGlobal('FileReader', Reader);
      const done = v.pick();
      act(() => done.complete('done'));
      expect(done.onload).toBeNull();
      expect(done.onerror).toBeNull();
      expect(v.change).toHaveBeenCalledExactlyOnceWith('done');
    });
    it('ignores stale errors and picker dismissal; releases a failed read', () => {
      const v = view();
      const old = v.pick();
      const stale = old.onerror!;
      const next = v.pick();
      act(() => stale());
      fireEvent.change(v.container.querySelector('input[type=file]')!, {
        target: { files: [] }
      });
      expect(v.notice).not.toHaveBeenCalled();
      act(() => next.complete('current'));
      expect(v.change).toHaveBeenCalledExactlyOnceWith('current');
      expect(next.onload).toBeNull();
      expect(next.onabort).toBeNull();
    });
    it('recovers from synchronous read failure and rejects non-text completion', () => {
      const v = view();
      vi.stubGlobal(
        'FileReader',
        class extends Reader {
          readAsText = vi.fn(() => {
            throw Error('private path');
          });
        }
      );
      const failed = v.pick();
      expect(v.notice).toHaveBeenCalledOnce();
      expect(failed.onload).toBeNull();
      vi.stubGlobal('FileReader', Reader);
      const nonText = v.pick();
      act(() => nonText.onload?.({ target: nonText }));
      expect(v.notice).toHaveBeenCalledTimes(2);
      const next = v.pick();
      act(() => next.complete('recovered'));
      expect(v.change).toHaveBeenCalledExactlyOnceWith('recovered');
    });
  });

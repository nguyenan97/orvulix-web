import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorkflowBuilder from './WorkflowBuilder';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import { executeWorkflow } from './engine';
import type { WorkflowWorker } from './runner';
import type { WorkflowRequest } from './protocol';
import { writeResultText } from '../text-result-clipboard/write';
import { downloadText } from './download';

vi.mock('../text-result-clipboard/write', () => ({
  writeResultText: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('./download', () => ({ downloadText: vi.fn() }));
class WorkerProbe implements WorkflowWorker {
  static instances: WorkerProbe[] = [];
  onmessage: WorkflowWorker['onmessage'] = null;
  onerror: WorkflowWorker['onerror'] = null;
  onmessageerror: WorkflowWorker['onmessageerror'] = null;
  request!: WorkflowRequest;
  terminate = vi.fn();
  constructor() {
    WorkerProbe.instances.push(this);
  }
  postMessage(request: WorkflowRequest) {
    this.request = request;
  }
  finish() {
    this.onmessage?.({
      data: {
        runId: this.request.runId,
        result: executeWorkflow(this.request.input, this.request.recipe)
      }
    } as MessageEvent);
  }
}
beforeEach(() => {
  vi.stubGlobal('Worker', WorkerProbe);
  WorkerProbe.instances = [];
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const setup = () =>
  render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: vi.fn() }}>
      <WorkflowBuilder />
    </CustomSnackBarContext.Provider>
  );
const source = () => screen.getByTestId('text-input');
const final = () => screen.getByTestId('workflow-result');
const run = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Run workflow' }));
  act(() => WorkerProbe.instances.at(-1)!.finish());
};

describe('workflow page with real runner/engine and controlled worker I/O', () => {
  it('copies/downloads literal text, invalidates on edit, and exports successful empty output', async () => {
    setup();
    const copy = screen.getByRole('button', { name: 'Copy final result' });
    const download = screen.getByRole('button', {
      name: 'Download final result'
    });
    expect(copy).toBeDisabled();
    fireEvent.change(source(), { target: { value: String.raw`  a\nb\t  ` } });
    run();
    await waitFor(() => expect(final()).toHaveValue(String.raw`a\nb\t`));
    fireEvent.click(copy);
    await waitFor(() =>
      expect(writeResultText).toHaveBeenCalledWith(String.raw`a\nb\t`)
    );
    fireEvent.click(download);
    expect(downloadText).toHaveBeenCalledWith(
      String.raw`a\nb\t`,
      expect.stringMatching(/workflow\.txt$/),
      'text/plain;charset=utf-8'
    );
    fireEvent.change(source(), { target: { value: '  ' } });
    expect(final()).toHaveValue('');
    expect(copy).toBeDisabled();
    run();
    await waitFor(() => expect(copy).toBeEnabled());
    expect(final()).toHaveValue('');
    fireEvent.click(copy);
    fireEvent.click(download);
    await waitFor(() => expect(writeResultText).toHaveBeenLastCalledWith(''));
    expect(downloadText).toHaveBeenLastCalledWith(
      '',
      expect.any(String),
      'text/plain;charset=utf-8'
    );
    fireEvent.change(source(), { target: { value: '' } });
    expect(copy).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run workflow' })).toBeDisabled();
  });
  it('adds/reorders/removes steps and invalidates current/running output on every edit', async () => {
    setup();
    fireEvent.change(source(), { target: { value: '  abc  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add step' }));
    run();
    await waitFor(() => expect(final()).toHaveValue('ABC'));
    expect(screen.getByLabelText('Step 1 output: Trim')).toHaveValue('abc');
    expect(screen.getByLabelText('Step 2 output: Uppercase')).toHaveValue(
      'ABC'
    );
    const up = screen.getByRole('button', { name: 'Move step 2 up' });
    up.focus();
    fireEvent.click(up);
    expect(final()).toHaveValue('');
    expect(
      screen.getByRole('heading', { name: 'Step 1: Uppercase' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Step 1: Uppercase', exact: true })
    ).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Run workflow' }));
    const old = WorkerProbe.instances.at(-1)!,
      late = old.onmessage!;
    fireEvent.click(screen.getByRole('button', { name: 'Remove step 1' }));
    expect(old.terminate).toHaveBeenCalledTimes(1);
    act(() =>
      late({
        data: {
          runId: old.request.runId,
          result: { kind: 'success', outputs: ['STALE', 'STALE'] }
        }
      } as MessageEvent)
    );
    expect(final()).toHaveValue('');
    expect(
      screen.getByRole('button', { name: 'Copy final result' })
    ).toBeDisabled();
    run();
    await waitFor(() => expect(final()).toHaveValue('abc'));
  });
  it('enforces input admission before allocating a worker and exports settings without source/results', async () => {
    setup();
    fireEvent.change(source(), { target: { value: 'private-source' } });
    run();
    await waitFor(() => expect(final()).toHaveValue('private-source'));
    fireEvent.click(screen.getByRole('button', { name: 'Export recipe' }));
    const text = vi.mocked(downloadText).mock.calls.at(-1)![0];
    expect(JSON.parse(text)).toEqual({
      version: 1,
      steps: [{ type: 'trim', options: {} }]
    });
    expect(text).not.toContain('private-source');
    fireEvent.change(source(), { target: { value: 'x'.repeat(65_537) } });
    expect(screen.getByRole('button', { name: 'Run workflow' })).toBeDisabled();
    expect(screen.getByText(/Input is too large/)).toBeVisible();
    expect(final()).toHaveValue('');
    expect(WorkerProbe.instances).toHaveLength(1);
  });
});

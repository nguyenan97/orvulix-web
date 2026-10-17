import { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ToolTextInput from '../../components/input/ToolTextInput';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import { writeResultText } from '../text-result-clipboard/write';
import { brand } from '../../brand/config';
import {
  ERRORS,
  LIMITS,
  STEP_LABELS,
  newStep,
  type ErrorCode,
  type Recipe,
  type Step,
  type StepType
} from './model';
import { exportRecipe } from './recipe';
import { useWorkflow } from './useWorkflow';
import { useRecipeImport } from './useRecipeImport';
import StepEditor from './StepEditor';
import { downloadText } from './download';

export default function WorkflowBuilder() {
  const [input, setInput] = useState('');
  const nextId = useRef(1);
  const pendingFocus = useRef<string | null>(null);
  const [draft, setDraft] = useState<{ id: number; step: Step }[]>(() => [
    { id: 0, step: newStep('trim') }
  ]);
  const recipe = useMemo<Recipe>(
    () => ({ version: 1, steps: draft.map((item) => item.step) }),
    [draft]
  );
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    document.getElementById(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  }, [draft]);
  const [selected, setSelected] = useState<StepType>('uppercase');
  const [importError, setImportError] = useState<ErrorCode | null>(null);
  const [imported, setImported] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState(0);
  const file = useRef<HTMLInputElement>(null);
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const workflow = useWorkflow(input, recipe);
  const importer = useRecipeImport((next) => {
    workflow.cancel();
    setDraft(next.steps.map((step) => ({ id: nextId.current++, step })));
    setImportError(null);
    setImported(true);
  }, setImportError);
  function change(next: typeof draft) {
    importer.cancel();
    workflow.cancel();
    setImportError(null);
    setImported(false);
    setDraft(next);
  }
  const outputs = workflow.result?.outputs ?? [];
  const preview = Math.min(selectedOutput, Math.max(0, outputs.length - 1));
  const success = workflow.result?.kind === 'success';
  const final = success ? outputs[outputs.length - 1] : '';
  const canRun =
    input.length > 0 &&
    input.length <= LIMITS.input &&
    recipe.steps.length > 0 &&
    !workflow.running;
  async function copy() {
    const value = workflow.getFinal();
    if (value === undefined) return;
    try {
      await writeResultText(value);
      showSnackBar('Text copied', 'success');
    } catch (error) {
      showSnackBar(
        error instanceof Error ? error.message : 'Could not copy text.',
        'error'
      );
    }
  }
  function download(kind: 'result' | 'recipe') {
    try {
      if (kind === 'recipe')
        downloadText(
          exportRecipe(recipe),
          `${brand.downloadPrefix}-workflow.json`,
          'application/json;charset=utf-8'
        );
      else {
        const value = workflow.getFinal();
        if (value === undefined) return;
        downloadText(
          value,
          `${brand.downloadPrefix}-workflow.txt`,
          'text/plain;charset=utf-8'
        );
      }
    } catch {
      showSnackBar('Could not create this download. Try again.', 'error');
    }
  }
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Typography>
        Build a text workflow, run it, and inspect every step. Text stays in
        this browser; recipes contain settings only. Nothing is saved
        automatically.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Limits: 65,536 input text units, 16 steps, 262,144 units per output and
        1,048,576 intermediate units in total. Text units are UTF-16 code units.
        Each run has a 5-second deadline.
      </Typography>
      <ToolTextInput
        value={input}
        onChange={(text) => {
          importer.cancel();
          workflow.cancel();
          setInput(text);
          setImported(false);
        }}
      />
      {input.length > LIMITS.input && (
        <Alert severity="error">{ERRORS['input-size']}</Alert>
      )}
      <Box component="section" aria-label="Workflow steps">
        <Stack spacing={2}>
          <Typography component="h2" variant="h6">
            Workflow steps ({recipe.steps.length}/{LIMITS.steps})
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              select
              label="Transformation to add"
              value={selected}
              sx={{ minWidth: { sm: 240 } }}
              onChange={(event) => setSelected(event.target.value as StepType)}
            >
              {Object.entries(STEP_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              id="workflow-add-step"
              disabled={recipe.steps.length >= LIMITS.steps}
              onClick={() =>
                change([
                  ...draft,
                  { id: nextId.current++, step: newStep(selected) }
                ])
              }
            >
              Add step
            </Button>
          </Stack>
          <Stack component="ol" spacing={2} sx={{ m: 0, p: 0 }}>
            {draft.map(({ id, step }, index) => (
              <StepEditor
                key={id}
                headingId={`workflow-step-${id}`}
                step={step}
                index={index}
                count={recipe.steps.length}
                onChange={(next) =>
                  change(
                    draft.map((value, position) =>
                      position === index ? { ...value, step: next } : value
                    )
                  )
                }
                onRemove={() => {
                  const next = draft[index + 1] ?? draft[index - 1];
                  pendingFocus.current = next
                    ? `workflow-step-${next.id}`
                    : 'workflow-add-step';
                  change(draft.filter((_, position) => position !== index));
                }}
                onMove={(direction) => {
                  pendingFocus.current = `workflow-step-${id}`;
                  const steps = [...draft];
                  [steps[index], steps[index + direction]] = [
                    steps[index + direction],
                    steps[index]
                  ];
                  change(steps);
                }}
              />
            ))}
          </Stack>
          {!recipe.steps.length && (
            <Typography>Add a transformation to start.</Typography>
          )}
        </Stack>
      </Box>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button variant="contained" disabled={!canRun} onClick={workflow.run}>
          Run workflow
        </Button>
        <Button disabled={!workflow.running} onClick={workflow.cancel}>
          Cancel run
        </Button>
        <Button onClick={() => file.current?.click()}>Import recipe</Button>
        <Button onClick={() => download('recipe')}>Export recipe</Button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          aria-label="Recipe file"
          hidden
          onChange={(event) => {
            setImported(false);
            importer.pick(event);
          }}
        />
      </Stack>
      {imported && (
        <Typography role="status">
          Recipe imported. Input text is unchanged.
        </Typography>
      )}
      {importError && (
        <Alert severity="error">
          {ERRORS[importError]} Existing steps are unchanged.
        </Alert>
      )}
      <Typography role="status" aria-live="polite">
        {workflow.running
          ? 'Running workflow...'
          : success
            ? 'Workflow complete.'
            : workflow.result?.kind === 'error'
              ? 'Workflow failed.'
              : 'Ready. Run the workflow after editing text or steps.'}
      </Typography>
      {workflow.running && <LinearProgress aria-label="Workflow running" />}
      {workflow.result?.kind === 'error' && (
        <Alert severity="error">
          {workflow.result.failedStep !== null
            ? `Step ${workflow.result.failedStep + 1}: `
            : ''}
          {ERRORS[workflow.result.error]}
        </Alert>
      )}
      <Box component="section" aria-label="Intermediate outputs">
        <Stack spacing={2}>
          <Typography component="h2" variant="h6">
            Intermediate outputs
          </Typography>
          {outputs.length > 0 && (
            <>
              <TextField
                select
                label="Intermediate step"
                value={preview}
                onChange={(event) =>
                  setSelectedOutput(Number(event.target.value))
                }
              >
                {outputs.map((output, index) => (
                  <MenuItem key={index} value={index}>
                    Step {index + 1}: {STEP_LABELS[recipe.steps[index].type]} (
                    {output.length} units)
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={`Step ${preview + 1} output: ${
                  STEP_LABELS[recipe.steps[preview].type]
                }`}
                value={outputs[preview]}
                multiline
                rows={4}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </>
          )}
        </Stack>
      </Box>
      <TextField
        label="Final result"
        value={final}
        multiline
        rows={6}
        fullWidth
        InputProps={{ readOnly: true }}
        inputProps={{ 'data-testid': 'workflow-result' }}
      />
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button disabled={!success} onClick={copy}>
          Copy final result
        </Button>
        <Button disabled={!success} onClick={() => download('result')}>
          Download final result
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Reverse keeps grapheme clusters together. Duplicate-line comparison is
        case-sensitive; sort uses UTF-16 ordering. Base64 uses standard
        canonical padding and UTF-8, allowing ASCII whitespace when decoding.
        URL steps use URI component encoding.
      </Typography>
    </Stack>
  );
}

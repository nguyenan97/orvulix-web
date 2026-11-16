import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import ToolTextInput from '../../components/input/ToolTextInput';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import { writeResultText } from '../text-result-clipboard/write';
import { brand } from '../../brand/config';
import { convert } from './convert';
import {
  ConversionError,
  LIMITS,
  MESSAGES,
  SAMPLE,
  type Conversion
} from './model';

export default function Converter() {
  const [source, setSource] = useState('');
  const [service, setService] = useState('app');
  const [result, setResult] = useState<{
    source: string;
    service: string;
    conversion: Conversion;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentYaml = useRef<string | undefined>(undefined);
  const epoch = useRef(0);
  const { showSnackBar } = useContext(CustomSnackBarContext);
  function invalidate() {
    currentYaml.current = undefined;
    epoch.current++;
    setResult(null);
    setError(null);
  }
  useLayoutEffect(
    () => () => {
      currentYaml.current = undefined;
      epoch.current++;
    },
    []
  );
  function run() {
    invalidate();
    try {
      const conversion = convert(source, service);
      currentYaml.current = conversion.yaml;
      setResult({ source, service, conversion });
    } catch (failure) {
      setError(
        failure instanceof ConversionError
          ? failure.message
          : 'Could not convert this command. Check its syntax.'
      );
    }
  }
  async function copy() {
    const text = currentYaml.current,
      owner = epoch.current;
    if (text === undefined) return;
    try {
      await writeResultText(text);
      if (owner === epoch.current)
        showSnackBar('Compose YAML copied', 'success');
    } catch (failure) {
      if (owner === epoch.current)
        showSnackBar(
          failure instanceof Error ? failure.message : 'Could not copy YAML.',
          'error'
        );
    }
  }
  function download() {
    const text = currentYaml.current;
    if (text === undefined) return;
    let url: string | undefined;
    const anchor = document.createElement('a');
    try {
      url = URL.createObjectURL(
        new Blob([text], { type: 'application/yaml;charset=utf-8' })
      );
      anchor.href = url;
      anchor.download = `${brand.downloadPrefix}-compose.yaml`;
      document.body.appendChild(anchor);
      anchor.click();
    } catch {
      showSnackBar('Could not download YAML. Try again.', 'error');
    } finally {
      anchor.remove();
      if (url !== undefined) {
        const ownedUrl = url;
        setTimeout(() => URL.revokeObjectURL(ownedUrl), 0);
      }
    }
  }
  const current =
    result?.source === source && result.service === service
      ? result.conversion
      : null;
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Typography>
        Convert one Linux-container docker run command into Compose YAML. This
        tool parses text locally; it never executes commands or contacts Docker.
      </Typography>
      <ToolTextInput
        title="Docker run command"
        value={source}
        onChange={(value) => {
          invalidate();
          setSource(value);
        }}
        placeholder={SAMPLE}
      />
      <TextField
        label="Compose service name"
        value={service}
        onChange={(event) => {
          invalidate();
          setService(event.target.value);
        }}
        helperText="Default: app. Container name is preserved separately when supplied."
      />
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button
          variant="contained"
          disabled={!source.trim() || source.length > LIMITS.input}
          onClick={run}
        >
          Convert command
        </Button>
        <Button
          onClick={() => {
            invalidate();
            setSource(SAMPLE);
          }}
        >
          Load example
        </Button>
        <Button
          onClick={() => {
            invalidate();
            setSource('');
          }}
        >
          Clear command
        </Button>
      </Stack>
      {source.length > LIMITS.input && (
        <Alert severity="error">{MESSAGES.input}</Alert>
      )}
      {error && <Alert severity="warning">{error}</Alert>}
      {current && (
        <Typography role="status">
          Compose YAML generated. Review it before use.
        </Typography>
      )}
      {current?.notices.map((notice) => (
        <Alert severity="info" key={notice}>
          {notice}
        </Alert>
      ))}
      <TextField
        label="Compose YAML"
        value={current?.yaml ?? ''}
        multiline
        rows={16}
        fullWidth
        InputProps={{ readOnly: true }}
        inputProps={{ 'data-testid': 'compose-output' }}
      />
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button disabled={!current} onClick={copy}>
          Copy Compose YAML
        </Button>
        <Button disabled={!current} onClick={download}>
          Download Compose YAML
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Supported: -p/--publish, -v/--volume (ro/rw), -e/--env, --name,
        --restart, --network/--net, -d, -i and -t. Unknown flags block output.
        POSIX quotes and backslash continuations are supported; PowerShell/cmd
        syntax, expansion, --rm, --mount and env files are not.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Limits: 32,768 UTF-16 input units, 512 arguments, 128 options and
        131,072 output units. Nothing is saved automatically. Literal dollars
        are escaped for Compose. Output includes supplied environment values;
        named volumes retain their Docker names and custom networks must already
        exist. Default network mode is bridge for Linux containers. Review host
        paths and Compose lifecycle differences before use.
      </Typography>
    </Stack>
  );
}

import { useContext, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import { writeResultText } from '../text-result-clipboard/write';
import { checkSize, compareChecksum, type Algorithm } from './model';
import { runChecksum } from './runner';

export default function Calculator() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [expected, setExpected] = useState('');
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const currentDigest = useRef('');
  const input = useRef<HTMLInputElement>(null);
  const { showSnackBar } = useContext(CustomSnackBarContext);
  function invalidate() {
    epoch.current++;
    controller.current?.abort();
    controller.current = null;
    currentDigest.current = '';
    setDigest('');
    setBusy(false);
    setError('');
  }
  useLayoutEffect(
    () => () => {
      epoch.current++;
      currentDigest.current = '';
      controller.current?.abort();
    },
    []
  );
  async function calculate() {
    if (!file) return;
    invalidate();
    const owner = epoch.current;
    const run = new AbortController();
    controller.current = run;
    setBusy(true);
    try {
      const value = await runChecksum(file, algorithm, run.signal);
      if (epoch.current === owner) {
        currentDigest.current = value;
        setDigest(value);
      }
    } catch (failure) {
      if (epoch.current === owner)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not calculate checksum. Try again.'
        );
    } finally {
      if (epoch.current === owner) {
        controller.current = null;
        setBusy(false);
      }
    }
  }
  async function copy() {
    const value = currentDigest.current,
      owner = epoch.current;
    if (!value) return;
    try {
      await writeResultText(value);
      if (epoch.current === owner) showSnackBar('Checksum copied', 'success');
    } catch (failure) {
      if (epoch.current === owner)
        showSnackBar(
          failure instanceof Error
            ? failure.message
            : 'Select the checksum and copy it manually.',
          'error'
        );
    }
  }
  const comparison = compareChecksum(expected, digest, algorithm);
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Typography>
        Calculate a local file checksum and compare it with an expected value.
        File contents are processed in your browser without upload or automatic
        saving.
      </Typography>
      <Stack spacing={1}>
        <Typography component="label" htmlFor="checksum-file">
          Choose a file (up to 64 MiB)
        </Typography>
        <input
          id="checksum-file"
          type="file"
          ref={input}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            event.target.value = '';
            if (!selected) return;
            invalidate();
            setFile(null);
            try {
              checkSize(selected.size);
              setFile(selected);
            } catch (failure) {
              setError((failure as Error).message);
            }
          }}
        />
        {file && (
          <Typography sx={{ overflowWrap: 'anywhere' }}>
            Selected: {file.name} ({file.size.toLocaleString()} bytes)
          </Typography>
        )}
      </Stack>
      <TextField
        select
        label="Hash algorithm"
        value={algorithm}
        onChange={(event) => {
          invalidate();
          setAlgorithm(event.target.value as Algorithm);
        }}
      >
        <MenuItem value="SHA-256">SHA-256</MenuItem>
        <MenuItem value="SHA-512">SHA-512</MenuItem>
      </TextField>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button
          variant="contained"
          disabled={!file || busy}
          onClick={calculate}
        >
          Calculate checksum
        </Button>
        <Button
          disabled={!busy}
          onClick={() => {
            invalidate();
            setError('Calculation cancelled.');
          }}
        >
          Cancel calculation
        </Button>
        <Button
          onClick={() => {
            invalidate();
            setFile(null);
            setExpected('');
            if (input.current) input.current.value = '';
          }}
        >
          Clear file
        </Button>
      </Stack>
      {busy && <Typography role="status">Calculating checksum...</Typography>}
      {error && <Alert severity="warning">{error}</Alert>}
      <TextField
        label="File checksum"
        value={digest}
        multiline
        minRows={2}
        fullWidth
        InputProps={{ readOnly: true }}
      />
      <Button disabled={!digest} onClick={copy}>
        Copy checksum
      </Button>
      <TextField
        label="Expected checksum (optional)"
        value={expected}
        onChange={(event) => setExpected(event.target.value)}
        error={comparison === 'invalid'}
        inputProps={{ maxLength: 256 }}
        helperText={
          comparison === 'invalid'
            ? `Enter exactly ${
                algorithm === 'SHA-256' ? 64 : 128
              } hexadecimal characters.`
            : 'Hexadecimal only. Letter case and surrounding whitespace are ignored.'
        }
      />
      {comparison === 'match' && (
        <Alert severity="success">Checksums match.</Alert>
      )}
      {comparison === 'mismatch' && (
        <Alert severity="error">Checksums do not match.</Alert>
      )}
      {comparison === 'pending' && (
        <Typography role="status">Calculate a checksum to compare.</Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        Requires HTTPS or localhost and Web Crypto. One file at a time, up to 64
        MiB; calculations stop after 30 seconds. Changing the file or algorithm
        clears the result. A matching checksum verifies equality with the
        supplied value, not its authenticity.
      </Typography>
    </Stack>
  );
}

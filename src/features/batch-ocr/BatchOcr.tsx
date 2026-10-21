import { useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { runBatch, type Result } from './run';
import { validateSelection } from './policy';

export default function BatchOcr() {
  const [files, setFiles] = useState<File[]>([]);
  const [lang, setLang] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result>();
  const [links, setLinks] = useState<{ txt: string; zip: string }>();
  const active = useRef<AbortController>();
  const deadline = useRef<number>();
  useLayoutEffect(
    () => () => {
      active.current?.abort();
      active.current = undefined;
      window.clearTimeout(deadline.current);
    },
    []
  );
  useLayoutEffect(() => {
    if (!result) {
      setLinks(undefined);
      return;
    }
    const txt = URL.createObjectURL(result.txt),
      zip = URL.createObjectURL(result.zip);
    setLinks({ txt, zip });
    return () => {
      URL.revokeObjectURL(txt);
      URL.revokeObjectURL(zip);
    };
  }, [result]);
  function invalidate() {
    window.clearTimeout(deadline.current);
    deadline.current = undefined;
    active.current?.abort();
    active.current = undefined;
    setBusy(false);
    setResult(undefined);
    setLinks(undefined);
    setStatus('');
    setError('');
  }
  async function run() {
    invalidate();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    const timeout = window.setTimeout(() => {
      if (active.current !== controller) return;
      controller.abort();
      active.current = undefined;
      setBusy(false);
      setError(
        'OCR exceeded the 180-second batch deadline. Try fewer or smaller images.'
      );
    }, 180_000);
    deadline.current = timeout;
    try {
      const output = await runBatch(
        files,
        lang,
        controller.signal,
        (message) => {
          if (active.current === controller) setStatus(message);
        }
      );
      if (active.current === controller) {
        setResult(output);
        setStatus('Batch complete. Review text before downloading.');
      }
    } catch (failure) {
      if (active.current === controller)
        setError(
          failure instanceof Error
            ? failure.message
            : 'OCR failed. Please retry.'
        );
    } finally {
      window.clearTimeout(timeout);
      if (deadline.current === timeout) deadline.current = undefined;
      if (active.current === controller) {
        active.current = undefined;
        setBusy(false);
      }
    }
  }
  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Images and recognized text are processed locally without upload. Run OCR
        downloads public language models from jsDelivr, which receives your IP
        address. Network access is required on first use; downloads may be
        cached by your browser. Accuracy varies: proofread results.
      </Alert>
      <Typography>
        Choose up to 10 static PNG/JPEG images, 4 MiB each, 24 MiB combined.
        Maximum 4096 pixels per side and 4 million pixels per image. Files run
        in the displayed selection order.
      </Typography>
      <Box>
        <input
          aria-label="Choose OCR images"
          type="file"
          accept="image/png,image/jpeg"
          multiple
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            event.target.value = '';
            invalidate();
            setFiles([]);
            if (!selected.length) return;
            try {
              validateSelection(selected);
              setFiles(selected);
            } catch (failure) {
              setError((failure as Error).message);
            }
          }}
        />
      </Box>
      {!!files.length && (
        <Box component="ol" sx={{ overflowWrap: 'anywhere', pl: 3 }}>
          {files.map((file, i) => (
            <li key={i}>{file.name}</li>
          ))}
        </Box>
      )}
      <FormControl fullWidth>
        <InputLabel id="batch-ocr-language">OCR language</InputLabel>
        <Select
          labelId="batch-ocr-language"
          label="OCR language"
          value={lang}
          onChange={(event) => {
            invalidate();
            setLang(event.target.value);
          }}
        >
          <MenuItem value="eng">English</MenuItem>
          <MenuItem value="vie">Vietnamese</MenuItem>
          <MenuItem value="eng+vie">English + Vietnamese</MenuItem>
        </Select>
      </FormControl>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          disabled={busy || !files.length || !lang}
          onClick={() => void run()}
        >
          Run OCR
        </Button>
        <Button
          disabled={!busy}
          onClick={() => {
            invalidate();
            setStatus('OCR cancelled. No partial output was kept.');
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={!busy && !files.length && !error}
          onClick={() => {
            invalidate();
            setFiles([]);
          }}
        >
          Clear
        </Button>
      </Stack>
      {busy && <LinearProgress aria-label="OCR progress" />}
      <Typography role="status" aria-live="polite">
        {status}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {result && (
        <>
          {result.texts.some((text) => !text.trim()) && (
            <Alert severity="warning">
              No text was detected in at least one image. Its ordered TXT entry
              is empty.
            </Alert>
          )}
          {result.texts.map((text, i) => (
            <TextField
              key={i}
              label={`Text ${i + 1}: ${files[i].name}`}
              value={text}
              multiline
              minRows={3}
              maxRows={12}
              InputProps={{ readOnly: true }}
            />
          ))}
          {links && (
            <Stack direction="row" spacing={2}>
              <Button component="a" href={links.txt} download="batch-ocr.txt">
                Download TXT
              </Button>
              <Button component="a" href={links.zip} download="batch-ocr.zip">
                Download ZIP
              </Button>
            </Stack>
          )}
        </>
      )}
      <Typography variant="body2">
        Text output only. PDF export, automatic language detection and layout
        preservation are not included. Processing stops after 180 seconds;
        output is limited to 100,000 characters per image and 500,000 per batch.
        Cancel or Clear discards partial results.
      </Typography>
    </Stack>
  );
}

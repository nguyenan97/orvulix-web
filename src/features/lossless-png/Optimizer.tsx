import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { checkSize } from './png';
import { runOptimization } from './runner';

export default function Optimizer() {
  const [file, setFile] = useState<File | null>(null),
    [result, setResult] = useState<{
      url: string;
      size: number;
      name: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const owner = useRef<AbortController | null>(null),
    url = useRef('');
  function invalidate() {
    owner.current?.abort();
    owner.current = null;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = '';
    setResult(null);
    setBusy(false);
    setError('');
  }
  useLayoutEffect(
    () => () => {
      owner.current?.abort();
      owner.current = null;
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = '';
    },
    []
  );
  async function optimize() {
    if (!file || owner.current) return;
    invalidate();
    const run = new AbortController();
    owner.current = run;
    setBusy(true);
    try {
      const bytes = await runOptimization(file, run.signal);
      if (owner.current !== run) return;
      url.current = URL.createObjectURL(
        new Blob([bytes], { type: 'image/png' })
      );
      setResult({
        url: url.current,
        size: bytes.byteLength,
        name: /\.png$/i.test(file.name) ? file.name : `${file.name}.png`
      });
    } catch (failure) {
      if (owner.current === run)
        setError(
          failure instanceof Error
            ? failure.message
            : 'PNG optimization failed.'
        );
    } finally {
      if (owner.current === run) {
        owner.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Typography>
        Recompress a static PNG without changing its pixel samples or accepted
        metadata. Processing stays in your browser, without upload or automatic
        saving.
      </Typography>
      <Typography component="label" htmlFor="lossless-png-file">
        Choose a PNG (up to 4 MiB)
      </Typography>
      <input
        id="lossless-png-file"
        type="file"
        accept="image/png,.png"
        style={{ maxWidth: '100%' }}
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
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button variant="contained" disabled={!file || busy} onClick={optimize}>
          Optimize PNG
        </Button>
        <Button
          disabled={!busy}
          onClick={() => {
            invalidate();
            setError('PNG optimization cancelled.');
          }}
        >
          Cancel optimization
        </Button>
        <Button
          onClick={() => {
            invalidate();
            setFile(null);
          }}
        >
          Clear file
        </Button>
      </Stack>
      {busy && <Typography role="status">Optimizing PNG...</Typography>}
      {error && <Alert severity="warning">{error}</Alert>}
      {result && file && (
        <Stack spacing={1}>
          <Alert severity="success">
            {result.size === file.size
              ? 'Original kept: recompression did not produce a smaller PNG.'
              : `Saved ${(file.size - result.size).toLocaleString()} bytes.`}
          </Alert>
          <Typography>Output: {result.size.toLocaleString()} bytes</Typography>
          <Button component="a" href={result.url} download={result.name}>
            Download PNG
          </Button>
        </Stack>
      )}
      <Typography variant="body2" color="text.secondary">
        Best-effort IDAT recompression, not palette reduction. Original bytes
        are kept if the result is equal or larger. Static PNG only: 4096 pixels
        per side, 4 million pixels, 512 chunks and 32 MiB filtered data. Work
        stops after 15 seconds. Unsupported unsafe-to-copy chunks and animated
        PNG are rejected. Metadata is preserved without decoding it; no image
        preview is loaded. Requires an updated browser with native compression
        streams.
      </Typography>
    </Stack>
  );
}

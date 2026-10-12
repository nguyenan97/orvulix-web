import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { DEFAULT_OPTIONS, type ImageOptions, validateOptions } from './model';
import { frameDocument, prepareHtml, type PreparedHtml } from './sanitize';
import { validateEmbeddedImages } from './assets';
import { SAMPLE_LOGO } from './sample-logo';

export const SAMPLE = `<div style="padding:24px;background-color:#f0fdfa">
  <img src="${SAMPLE_LOGO}" alt="Example logo" width="32" height="32">
  <h1 style="color:#0f766e">Orvulix invoice</h1>
  <p>Static HTML example - Nguyễn An</p>
  <table style="width:100%"><thead><tr><th>Item</th><th>Amount</th></tr></thead>
  <tbody><tr><td>Design review</td><td>$120</td></tr><tr><td>Development</td><td>$280</td></tr></tbody></table>
  <p style="font-weight:bold">Total: $400</p>
</div>`;

export default function HtmlToImage() {
  const [html, setHtml] = useState('');
  const [options, setOptions] = useState<ImageOptions>({ ...DEFAULT_OPTIONS });
  const [preview, setPreview] = useState<PreparedHtml | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const job = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(
    () => () => {
      revision.current++;
      job.current?.abort();
      job.current = null;
    },
    []
  );
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  const invalidate = () => {
    revision.current++;
    job.current?.abort();
    job.current = null;
    setBusy(false);
    setFile(null);
    setPreview(null);
    setNotices([]);
    setError('');
  };
  const editHtml = (value: string) => {
    invalidate();
    setHtml(value);
  };
  const editOptions = (next: ImageOptions) => {
    invalidate();
    setOptions(next);
  };
  const prepare = async (controller: AbortController) => {
    validateOptions(options);
    const prepared = prepareHtml(html);
    if (prepared.assets.length)
      await validateEmbeddedImages(prepared.assets, controller.signal);
    if (job.current !== controller || controller.signal.aborted)
      throw new DOMException('Conversion cancelled.', 'AbortError');
    setNotices(prepared.notices);
    setPreview(prepared);
    return prepared;
  };
  const showPreview = async () => {
    if (job.current) return;
    const controller = new AbortController();
    job.current = controller;
    setBusy(true);
    setError('');
    try {
      await prepare(controller);
    } catch (reason) {
      if (job.current === controller) {
        setPreview(null);
        setError(reason instanceof Error ? reason.message : 'Preview failed.');
      }
    } finally {
      if (job.current === controller) {
        job.current = null;
        setBusy(false);
      }
    }
  };
  const convert = async () => {
    if (job.current) return;
    const controller = new AbortController();
    job.current = controller;
    setBusy(true);
    setError('');
    setFile(null);
    try {
      const prepared = await prepare(controller);
      const { captureHtml } = await import('./renderer');
      const output = await captureHtml(
        prepared,
        { ...options },
        controller.signal
      );
      if (job.current === controller) setFile(output);
    } catch (reason) {
      if (job.current === controller)
        setError(
          reason instanceof Error ? reason.message : 'Conversion failed.'
        );
    } finally {
      if (job.current === controller) {
        job.current = null;
        setBusy(false);
      }
    }
  };
  const cancel = () => {
    invalidate();
    setError('Conversion cancelled. Edit or convert again to retry.');
  };
  const upload = async (selected?: File) => {
    if (!selected) return;
    invalidate();
    const id = revision.current;
    try {
      if (!/\.html?$/i.test(selected.name))
        throw Error('Choose an .html or .htm file.');
      if (selected.size > 64 * 1024)
        throw Error('HTML must be at most 64 KiB.');
      const value = await selected.text();
      if (revision.current === id) editHtml(value.replace(/^\uFEFF/, ''));
    } catch (reason) {
      if (revision.current === id)
        setError(
          reason instanceof Error ? reason.message : 'File could not be read.'
        );
    }
  };
  return (
    <Stack spacing={2} id="tool">
      <Alert severity="info">
        Local static HTML with simple inline styles and embedded PNG/JPEG data
        URLs. Scripts, SVG, stylesheet blocks and external resources are
        removed. Output is cropped to the selected dimensions. Up to 4 images,
        48 KiB combined image data and 1 megapixel of source images.
      </Alert>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
          minWidth: 0
        }}
      >
        <Card variant="outlined" sx={{ minWidth: 0 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">HTML input</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button component="label" variant="outlined">
                  Upload HTML
                  <input
                    aria-label="Upload HTML file"
                    hidden
                    type="file"
                    accept=".html,.htm,text/html"
                    onChange={(e) => {
                      void upload(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </Button>
                <Button onClick={() => editHtml(SAMPLE)}>Load example</Button>
                <Button
                  onClick={() => {
                    invalidate();
                    setHtml('');
                    setOptions({ ...DEFAULT_OPTIONS });
                  }}
                >
                  Reset
                </Button>
              </Stack>
              <TextField
                label="HTML markup"
                multiline
                minRows={12}
                maxRows={20}
                value={html}
                onChange={(e) => editHtml(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void convert();
                  }
                }}
                helperText="Up to 64 KiB, 1000 nodes and 24 levels. Ctrl/Cmd+Enter converts."
                fullWidth
                inputProps={{ spellCheck: false }}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => void showPreview()}
                  disabled={busy}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void convert()}
                  disabled={busy}
                >
                  Convert to image
                </Button>
                {busy && <Button onClick={cancel}>Cancel</Button>}
              </Stack>
              {busy && (
                <Typography role="status">
                  Preparing and rendering locally...
                </Typography>
              )}
              {error && <Alert severity="error">{error}</Alert>}
              {notices.map((notice) => (
                <Alert severity="warning" key={notice}>
                  {notice}
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ minWidth: 0 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Image options</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Width (px)"
                  type="number"
                  value={options.width}
                  onChange={(e) =>
                    editOptions({ ...options, width: Number(e.target.value) })
                  }
                  inputProps={{ min: 320, max: 1280, step: 1 }}
                  fullWidth
                />
                <TextField
                  label="Height (px)"
                  type="number"
                  value={options.height}
                  onChange={(e) =>
                    editOptions({ ...options, height: Number(e.target.value) })
                  }
                  inputProps={{ min: 100, max: 1080, step: 1 }}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Format"
                  select
                  value={options.format}
                  onChange={(e) =>
                    editOptions({
                      ...options,
                      format: e.target.value as ImageOptions['format']
                    })
                  }
                  fullWidth
                >
                  <MenuItem value="png">PNG</MenuItem>
                  <MenuItem value="jpeg">JPEG</MenuItem>
                </TextField>
                <TextField
                  label="Scale"
                  select
                  value={options.scale}
                  onChange={(e) =>
                    editOptions({ ...options, scale: Number(e.target.value) })
                  }
                  fullWidth
                >
                  <MenuItem value={1}>1x</MenuItem>
                  <MenuItem value={2}>2x</MenuItem>
                </TextField>
              </Stack>
              <TextField
                label="Background"
                select
                value={options.background}
                onChange={(e) =>
                  editOptions({
                    ...options,
                    background: e.target.value as ImageOptions['background']
                  })
                }
                helperText="JPEG always uses white. Transparency is available for PNG."
                fullWidth
              >
                <MenuItem value="white">White</MenuItem>
                <MenuItem value="transparent">Transparent</MenuItem>
              </TextField>
              {options.format === 'jpeg' && (
                <TextField
                  label="JPEG quality"
                  type="number"
                  value={options.quality}
                  onChange={(e) =>
                    editOptions({ ...options, quality: Number(e.target.value) })
                  }
                  inputProps={{ min: 0.1, max: 1, step: 0.1 }}
                  fullWidth
                />
              )}
              <TextField
                label="Filename"
                value={options.filename}
                onChange={(e) =>
                  editOptions({ ...options, filename: e.target.value })
                }
                inputProps={{ maxLength: 100 }}
                fullWidth
              />
              <Typography variant="body2">
                Output: {options.width * options.scale} x{' '}
                {options.height * options.scale} px. Maximum 2 megapixels and 8
                MiB.
              </Typography>
              <Button onClick={() => editOptions({ ...DEFAULT_OPTIONS })}>
                Restore default options
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
      {preview && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sanitized HTML preview
            </Typography>
            <Box sx={{ overflow: 'auto', maxWidth: '100%', maxHeight: 500 }}>
              <iframe
                title="Sanitized HTML preview"
                sandbox="allow-same-origin"
                srcDoc={frameDocument(preview)}
                width={options.width}
                height={options.height}
                style={{
                  display: 'block',
                  border: 0,
                  background:
                    options.background === 'white' || options.format === 'jpeg'
                      ? 'white'
                      : 'transparent'
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
      {file && url && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Result</Typography>
              <Box
                component="img"
                src={url}
                alt="Converted HTML image"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 500,
                  objectFit: 'contain',
                  alignSelf: 'flex-start'
                }}
              />
              <Typography variant="body2">
                {file.name} - {(file.size / 1024).toFixed(1)} KiB
              </Typography>
              <Button
                variant="contained"
                component="a"
                href={url}
                download={file.name}
                sx={{ alignSelf: 'flex-start' }}
              >
                Download {options.format === 'png' ? 'PNG' : 'JPEG'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

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
import { SAMPLE } from './sample';
export { SAMPLE } from './sample';
import { inspectLayout } from './layout';
import { DEFAULT_PDF_OPTIONS, pdfGeometry, type PdfOptions } from './pdf-model';
import PdfOptionsFields from './PdfOptionsFields';

export default function HtmlToImage({
  output = 'image'
}: { output?: 'image' | 'pdf'; title?: string } = {}) {
  const isPdf = output === 'pdf';
  const defaults = {
    ...DEFAULT_OPTIONS,
    filename: isPdf ? 'html-pdf' : DEFAULT_OPTIONS.filename
  };
  const [pdfOptions, setPdfOptions] = useState<PdfOptions>(() => ({
    ...DEFAULT_PDF_OPTIONS,
    margins: { ...DEFAULT_PDF_OPTIONS.margins }
  }));
  const [html, setHtml] = useState('');
  const [options, setOptions] = useState<ImageOptions>(defaults);
  const [preview, setPreview] = useState<PreparedHtml | null>(null);
  const previewSource = useRef<PreparedHtml | null>(null);
  const [previewRun, setPreviewRun] = useState(0);
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
      previewSource.current = null;
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
    previewSource.current = null;
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
    if (isPdf) pdfGeometry(pdfOptions, options);
    const prepared = prepareHtml(html);
    if (prepared.assets.length)
      await validateEmbeddedImages(prepared.assets, controller.signal);
    if (job.current !== controller || controller.signal.aborted)
      throw new DOMException('Conversion cancelled.', 'AbortError');
    setNotices(prepared.notices);
    previewSource.current = prepared;
    setPreviewRun((run) => run + 1);
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
      const report = (report: import('./layout').LayoutReport) => {
        if (job.current === controller && !controller.signal.aborted)
          setNotices([...prepared.notices, ...report.notices]);
      };
      const output = isPdf
        ? await (
            await import('./pdf-renderer')
          ).capturePdf(
            prepared,
            { ...options },
            { ...pdfOptions, margins: { ...pdfOptions.margins } },
            controller.signal,
            report
          )
        : await (
            await import('./renderer')
          ).captureHtml(prepared, { ...options }, controller.signal, report);
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
  let geometry: ReturnType<typeof pdfGeometry> | null = null;
  if (isPdf) {
    try {
      geometry = pdfGeometry(pdfOptions, options);
    } catch {
      /* Validate on explicit action. */
    }
  }
  return (
    <Stack spacing={2} id="tool">
      <Alert severity="info">
        Local static HTML with simple inline styles and embedded PNG/JPEG data
        URLs. Scripts, SVG, stylesheet blocks and external resources are
        removed. Output is cropped to the selected dimensions. Up to 4 images,
        48 KiB combined image data and 1 megapixel of source images.
      </Alert>
      {isPdf && (
        <Alert severity="info">
          One-page raster PDF: text is not searchable or selectable. The HTML
          viewport is fitted and centered inside the margins without stretching.
          Scale changes raster resolution only. No pagination.
        </Alert>
      )}
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
                    setOptions({ ...defaults });
                    setPdfOptions({
                      ...DEFAULT_PDF_OPTIONS,
                      margins: { ...DEFAULT_PDF_OPTIONS.margins }
                    });
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
                  {isPdf ? 'Convert to PDF' : 'Convert to image'}
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
              <Typography variant="h6">
                {isPdf ? 'PDF options' : 'Image options'}
              </Typography>
              {isPdf && (
                <PdfOptionsFields
                  value={pdfOptions}
                  onChange={(next) => {
                    invalidate();
                    setPdfOptions(next);
                  }}
                />
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Width (px)"
                  type="number"
                  value={options.width}
                  onChange={(e) =>
                    editOptions({ ...options, width: Number(e.target.value) })
                  }
                  inputProps={{ min: 320, max: 1280, step: 1 }}
                  helperText={
                    isPdf
                      ? 'HTML viewport width, not the PDF page size.'
                      : undefined
                  }
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
                  helperText={
                    isPdf
                      ? 'Content outside this viewport is cropped or rejected.'
                      : undefined
                  }
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {!isPdf && (
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
                )}
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
                helperText={
                  isPdf
                    ? 'PNG transparency is preserved; PDF paper and page preview are white.'
                    : 'JPEG always uses white. Transparency is available for PNG.'
                }
                fullWidth
              >
                <MenuItem value="white">White</MenuItem>
                <MenuItem value="transparent">Transparent</MenuItem>
              </TextField>
              {!isPdf && options.format === 'jpeg' && (
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
                label="Overflow handling"
                select
                value={options.cropPolicy}
                onChange={(e) =>
                  editOptions({
                    ...options,
                    cropPolicy: e.target.value as ImageOptions['cropPolicy']
                  })
                }
                helperText={
                  isPdf
                    ? 'One PDF page only. Overflow is checked against the HTML viewport.'
                    : 'One image only. Table rows and text are not moved onto another page.'
                }
                fullWidth
              >
                <MenuItem value="crop">Allow cropping</MenuItem>
                <MenuItem value="reject">Stop if content is cropped</MenuItem>
              </TextField>
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
              {isPdf && geometry && (
                <Typography variant="body2">
                  Page: {geometry.pageWidth} x {geometry.pageHeight} mm.
                  Viewport fits at {geometry.mmPerCssPixel.toFixed(3)} mm per
                  CSS pixel. PDF limit: 8 MiB.
                </Typography>
              )}
              <Button
                onClick={() => {
                  editOptions({ ...defaults });
                  setPdfOptions({
                    ...DEFAULT_PDF_OPTIONS,
                    margins: { ...DEFAULT_PDF_OPTIONS.margins }
                  });
                }}
              >
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
              <Box
                data-pdf-page-preview={isPdf && geometry ? 'true' : undefined}
                sx={
                  isPdf && geometry
                    ? {
                        position: 'relative',
                        width: geometry.pageWidth * 2,
                        height: geometry.pageHeight * 2,
                        bgcolor: 'white',
                        outline: '1px solid #cbd5e1'
                      }
                    : undefined
                }
              >
                <iframe
                  key={previewRun}
                  title="Sanitized HTML preview"
                  sandbox="allow-same-origin"
                  srcDoc={frameDocument(preview)}
                  width={options.width}
                  height={options.height}
                  onLoad={(event) => {
                    if (previewSource.current !== preview) return;
                    const body = event.currentTarget.contentDocument?.body;
                    if (body)
                      setNotices([
                        ...preview.notices,
                        ...inspectLayout(body, options).notices
                      ]);
                  }}
                  style={{
                    display: 'block',
                    ...(isPdf && geometry
                      ? ({
                          position: 'absolute',
                          left: geometry.x * 2,
                          top: geometry.y * 2,
                          transform: `scale(${geometry.mmPerCssPixel * 2})`,
                          transformOrigin: 'top left'
                        } as const)
                      : {}),
                    border: 0,
                    background:
                      options.background === 'white' ||
                      options.format === 'jpeg'
                        ? 'white'
                        : 'transparent'
                  }}
                />
              </Box>
            </Box>
            {isPdf && (
              <Typography variant="body2">
                Page preview uses the same viewport fit and margins as export.
                System fonts can differ by OS; PDF paper is white.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      {file && url && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Result</Typography>
              {!isPdf && (
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
              )}
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
                Download{' '}
                {isPdf ? 'PDF' : options.format === 'png' ? 'PNG' : 'JPEG'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

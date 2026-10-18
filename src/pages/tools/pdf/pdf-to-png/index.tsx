import { useState } from 'react';
import { Alert, Box } from '@mui/material';
import { usePdfConversion } from '../../../../features/pdf-conversion/usePdfConversion';
import ToolContent from '@components/ToolContent';
import ToolPdfInput from '@components/input/ToolPdfInput';
import { ToolComponentProps } from '@tools/defineTool';
import { convertPdfToPngImages } from './service';
import ToolMultiFileResult from '@components/result/ToolMultiFileResult';

async function convert(file: File, signal: AbortSignal) {
  const { images, zipFile } = await convertPdfToPngImages(file, signal);
  return {
    files: images.map(
      (image) => new File([image.blob], image.filename, { type: 'image/png' })
    ),
    zipFile
  };
}

export default function PdfToPng({ title }: ToolComponentProps) {
  const [input, setInput] = useState<File | null>(null);
  const job = usePdfConversion(convert);
  const changeInput = (file: File | null) => {
    job.invalidate();
    setInput(file);
  };

  return (
    <ToolContent
      title={title}
      input={input}
      initialValues={{}}
      compute={job.compute}
      inputComponent={
        <ToolPdfInput
          value={input}
          onChange={changeInput}
          accept={['application/pdf']}
          title="Upload a PDF"
        />
      }
      resultComponent={
        <Box>
          {job.error && (
            <Alert severity="error" aria-label="PDF conversion error">
              {job.error}
            </Alert>
          )}
          <ToolMultiFileResult
            title="Converted PNG Pages"
            value={job.result?.files ?? []}
            zipFile={job.result?.zipFile ?? null}
            loading={job.loading}
            loadingText="Converting PDF pages"
          />
        </Box>
      }
      getGroups={null}
      toolInfo={{
        title: 'Convert PDF pages into PNG images',
        description:
          'Upload a readable PDF up to 32 MiB and 500 pages. Conversion has a 30 second deadline. Render limits: 4096 per side, 8 Mi pixels per page, 32 Mi pixels total, 64 MiB PNG/ZIP output. Preview, download individually, or get all pages in a ZIP.'
      }}
    />
  );
}

import { useState } from 'react';
import { Alert, Box } from '@mui/material';
import { usePdfConversion } from '../../../../features/pdf-conversion/usePdfConversion';
import ToolFileResult from '@components/result/ToolFileResult';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolPdfInput from '@components/input/ToolPdfInput';
import { convertPdfToEpub } from './service';

export default function PdfToEpub({ title }: ToolComponentProps) {
  const [input, setInput] = useState<File | null>(null);
  const job = usePdfConversion(convertPdfToEpub);
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
          title={'Input PDF'}
        />
      }
      getGroups={null}
      resultComponent={
        <Box>
          {job.error && (
            <Alert severity="error" aria-label="PDF conversion error">
              {job.error}
            </Alert>
          )}
          <ToolFileResult
            title={'EPUB Output'}
            value={job.result}
            extension={'epub'}
            loading={job.loading}
            loadingText={'Converting PDF to EPUB...'}
          />
        </Box>
      }
      toolInfo={{
        title: 'How to Use PDF to EPUB?',
        description: `Upload a readable PDF up to 32 MiB and 500 pages. Conversion has a 30 second deadline, a 2 Mi UTF-16 text limit and a 16 MiB EPUB output limit. Text is preserved as literal XML content for e-reader devices.`
      }}
    />
  );
}

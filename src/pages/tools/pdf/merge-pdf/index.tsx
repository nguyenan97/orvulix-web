import { useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { usePdfMerge } from '../../../../features/pdf-merge/usePdfMerge'; // ORVULIX: merge output ownership.
import ToolFileResult from '@components/result/ToolFileResult';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolMultiPdfInput, {
  MultiPdfInput
} from '@components/input/ToolMultiplePdfInput';
import { useTranslation } from 'react-i18next';

export default function MergePdf({ title }: ToolComponentProps) {
  const { t } = useTranslation('pdf');
  const [input, setFiles] = useState<MultiPdfInput[]>([]);
  const { result, loading, error, compute, invalidate } = usePdfMerge();
  const setInput: React.Dispatch<React.SetStateAction<MultiPdfInput[]>> = (
    next
  ) => {
    invalidate();
    setFiles(next);
  };

  return (
    <ToolContent
      title={title}
      input={input}
      setInput={setInput}
      initialValues={input.map((i) => i.file)}
      compute={compute}
      inputComponent={
        <ToolMultiPdfInput
          value={input}
          onChange={setInput}
          accept={['application/pdf']}
          title={t('merge.inputTitle')}
          type="pdf"
        />
      }
      getGroups={null}
      resultComponent={
        <Box>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Up to 20 PDFs, 32 MiB each, 128 MiB combined, 500 pages and 64 MiB
            output. Clear cancels the current result; processing stops at the
            next safe checkpoint.
          </Typography>
          <ToolFileResult
            title={t('merge.resultTitle')}
            value={result}
            extension={'pdf'}
            loading={loading}
            loadingText={t('merge.loadingText')}
          />
        </Box>
      }
      toolInfo={{
        title: t('merge.toolInfo.title'),
        description: t('merge.toolInfo.description')
      }}
    />
  );
}

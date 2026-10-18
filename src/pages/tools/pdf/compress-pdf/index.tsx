import { Alert, Box, Typography } from '@mui/material';
import React, { useState, useEffect, useContext } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import { compressPdf } from './service';
import { useGhostscriptJob } from '../../../../lib/ghostscript/useGhostscriptJob';
import { InitialValuesType, CompressionLevel } from './types';
import ToolPdfInput from '@components/input/ToolPdfInput';
import ToolFileResult from '@components/result/ToolFileResult';
import SimpleRadio from '@components/options/SimpleRadio';
import { PDFDocument } from 'pdf-lib';
import { CustomSnackBarContext } from '../../../../contexts/CustomSnackBarContext';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {
  compressionLevel: 'low'
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function CompressPdf({ title }: ToolComponentProps) {
  const { t } = useTranslation('pdf');
  const [input, setInput] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    size: string;
    pages: number;
  } | null>(null);
  const { showSnackBar } = useContext(CustomSnackBarContext);

  // Get the PDF info when a file is uploaded
  useEffect(() => {
    let current = true;
    setFileInfo(null);
    const getPdfInfo = async () => {
      if (!input || input.size > 32 * 1024 * 1024) {
        setFileInfo(null);
        return;
      }

      try {
        const arrayBuffer = await input.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = pdf.getPageCount();
        const size = formatFileSize(input.size);

        if (current) setFileInfo({ size, pages });
      } catch {
        if (!current) return;
        setFileInfo(null);
        showSnackBar(t('compressPdf.errorReadingPdf'), 'error');
      }
    };

    getPdfInfo();
    return () => {
      current = false;
    };
  }, [input, showSnackBar, t]);

  const job = useGhostscriptJob(compressPdf);
  const changeInput = (file: File | null) => {
    job.invalidate();
    setInput(file);
  };
  const resultSize = job.result ? formatFileSize(job.result.size) : '';

  const compressionOptions: {
    value: CompressionLevel;
    label: string;
    description: string;
  }[] = [
    {
      value: 'low',
      label: t('compressPdf.lowCompression'),
      description: t('compressPdf.lowCompressionDescription')
    },
    {
      value: 'medium',
      label: t('compressPdf.mediumCompression'),
      description: t('compressPdf.mediumCompressionDescription')
    },
    {
      value: 'high',
      label: t('compressPdf.highCompression'),
      description: t('compressPdf.highCompressionDescription')
    }
  ];

  return (
    <ToolContent
      title={title}
      toolInfo={{
        title: 'PDF processing limits',
        description:
          'Input limit: 32 MiB. Output limit: 64 MiB. Worker startup and processing deadline: 30 seconds. Ghostscript downloads its WASM engine from cdn-wasm.b-cdn.net; PDF bytes stay in your browser. Clear or change options to cancel the current job.'
      }}
      input={input}
      setInput={setInput}
      initialValues={initialValues}
      compute={job.compute}
      inputComponent={
        <ToolPdfInput
          value={input}
          onChange={changeInput}
          accept={['application/pdf']}
          title={t('compressPdf.inputTitle')}
        />
      }
      resultComponent={
        <Box>
          {job.error && (
            <Alert severity="error" aria-label="PDF processing error">
              {job.error}
            </Alert>
          )}
          <ToolFileResult
            title={t('compressPdf.resultTitle')}
            value={job.result}
            extension={'pdf'}
            loading={job.loading}
            loadingText={t('compressPdf.compressingPdf')}
          />
        </Box>
      }
      getGroups={({ values, updateField }) => [
        {
          title: t('compressPdf.compressionSettings'),
          component: (
            <Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('compressPdf.compressionLevel')}
                </Typography>

                {compressionOptions.map((option) => (
                  <SimpleRadio
                    key={option.value}
                    title={option.label}
                    description={option.description}
                    checked={values.compressionLevel === option.value}
                    onClick={() => {
                      job.invalidate();
                      updateField('compressionLevel', option.value);
                    }}
                  />
                ))}
              </Box>
              {fileInfo && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">
                    {t('compressPdf.fileSize')}:{' '}
                    <strong>{fileInfo.size}</strong>
                  </Typography>
                  <Typography variant="body2">
                    {t('compressPdf.pages')}: <strong>{fileInfo.pages}</strong>
                  </Typography>
                  {resultSize && (
                    <Typography variant="body2">
                      {t('compressPdf.compressedFileSize')}:{' '}
                      <strong>{resultSize}</strong>
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )
        }
      ]}
    />
  );
}

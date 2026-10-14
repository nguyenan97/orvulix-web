import { Box } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import ToolImageInput from '@components/input/ToolImageInput';
import ToolFileResult from '@components/result/ToolFileResult';
import TextFieldWithDesc from 'components/options/TextFieldWithDesc';
import { compressPng } from '../../../../../features/png-compression/compress'; // ORVULIX-UPSTREAM: dimension-preserving adaptation of omni-tools #461.
import Typography from '@mui/material/Typography';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import { Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

const initialValues = {
  rate: '50'
};
const validationSchema = Yup.object({
  // splitSeparator: Yup.string().required('The separator is required')
});

export default function ChangeColorsInPng({ title }: ToolComponentProps) {
  const { t } = useTranslation('image');
  const job = useRef<AbortController | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(
    () => () => {
      job.current?.abort();
      job.current = null;
    },
    []
  );
  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null); // Store original file size
  const [compressedSize, setCompressedSize] = useState<number | null>(null); // Store compressed file size

  const compressImage = async (file: File, rate: number) => {
    job.current?.abort();
    const controller = new AbortController();
    job.current = controller;
    setResult(null);
    setCompressedSize(null);
    setError('');
    setLoading(true);

    // Set original file size
    setOriginalSize(file.size);

    try {
      const compressedFile = await compressPng(file, rate, controller.signal);
      if (job.current !== controller || controller.signal.aborted) return;
      setResult(compressedFile);
      setCompressedSize(compressedFile.size); // Set compressed file size
    } catch (error) {
      if (job.current === controller && !controller.signal.aborted)
        setError(
          error instanceof Error ? error.message : 'PNG compression failed.'
        );
    } finally {
      if (job.current === controller) setLoading(false);
    }
  };

  const compute = (optionsValues: typeof initialValues, input: File | null) => {
    if (!input) {
      job.current?.abort();
      job.current = null;
      setResult(null);
      setOriginalSize(null);
      setCompressedSize(null);
      setError('');
      setLoading(false);
      return;
    }

    const { rate } = optionsValues;
    compressImage(input, Number(rate)); // Pass the rate as a number
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolImageInput
          value={input}
          onChange={setInput}
          accept={['image/png']}
          title={'Input PNG'}
        />
      }
      resultComponent={
        <Box>
          <Alert severity="info">
            {t(
              'compressPng.dimensionsNotice',
              'Keeps image dimensions; palette colors may change. The 1 MiB size target is best effort. Static PNG only: up to 16 MiB, 4096 px per side and 8 megapixels.'
            )}
          </Alert>
          {error && <Alert severity="error">{error}</Alert>}
          <ToolFileResult
            title={'Compressed PNG'}
            value={result}
            extension={'png'}
            loading={loading}
          />
        </Box>
      }
      initialValues={initialValues}
      getGroups={({ values, updateField }) => [
        {
          title: 'Compression options',
          component: (
            <Box>
              <TextFieldWithDesc
                value={values.rate}
                label={t(
                  'compressPng.paletteQuality',
                  'Palette quality (1-100)'
                )}
                onOwnChange={(val) => updateField('rate', val)}
                description={t(
                  'compressPng.paletteHint',
                  'Lower values reduce palette colors, not image dimensions. Compression is not guaranteed lossless.'
                )}
              />
            </Box>
          )
        },
        {
          title: 'File sizes',
          component: (
            <Box>
              <Box>
                {originalSize !== null && (
                  <Typography>
                    Original Size: {(originalSize / 1024).toFixed(2)} KB
                  </Typography>
                )}
                {compressedSize !== null && (
                  <Typography>
                    Compressed Size: {(compressedSize / 1024).toFixed(2)} KB
                  </Typography>
                )}
              </Box>
            </Box>
          )
        }
      ]}
      compute={compute}
      setInput={setInput}
    />
  );
}

import { TimingControls } from '../../../../../features/gif-conversion/TimingControls';
import { timingError } from '../../../../../features/gif-conversion/timing';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import ToolFileResult from '@components/result/ToolFileResult';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolMultipleImageInput, {
  MultiImageInput
} from '@components/input/ToolMultipleImageInput';
import { InitialValuesType } from './types';
import { useTranslation } from 'react-i18next';
import { useGifConversion } from '../../../../../features/gif-conversion/useGifConversion'; // ORVULIX: latest GIF job ownership.
import { FrameOrder } from '../../../../../features/gif-conversion/FrameOrder';

const initialValues: InitialValuesType = {
  frameRateMode: 'fps',
  frameRateValue: 10
};
// Keep shared Formik auto-compute unchanged for other tools; GIF runs by gesture.
const skipAutomaticConversion = () => {};

export default function ImagesToGif({ title }: ToolComponentProps) {
  const { t } = useTranslation('video');
  const [input, setFiles] = useState<MultiImageInput[]>([]);
  const {
    result,
    loading,
    error,
    busy,
    create,
    invalidate: discard
  } = useGifConversion();
  const [cancelled, setCancelled] = useState(false);
  const invalidate = () => {
    setCancelled(false);
    discard();
  };
  const setInput: React.Dispatch<React.SetStateAction<MultiImageInput[]>> = (
    next
  ) => {
    invalidate();
    setFiles(next);
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <Box>
          <ToolMultipleImageInput
            value={input}
            onChange={setInput}
            type="image"
            accept={['image/*']}
            title={t('gif.imagesToGif.inputTitle')}
          />
          <FrameOrder frames={input} onChange={setInput} />
        </Box>
      }
      resultComponent={
        <Box>
          {error && <Alert severity="error">{error}</Alert>}
          {cancelled && (
            <Alert severity="info">{t('gif.imagesToGif.cancelledText')}</Alert>
          )}
          <Typography role="status" sx={{ mb: 1 }}>
            {t(
              busy && !loading
                ? 'gif.imagesToGif.settlingText'
                : loading
                  ? 'gif.imagesToGif.loadingText'
                  : result
                    ? 'gif.imagesToGif.readyText'
                    : 'gif.imagesToGif.createHint'
            )}
          </Typography>
          <ToolFileResult
            title={t('gif.imagesToGif.resultTitle')}
            value={result}
            extension="gif"
            loading={loading}
            loadingText={t('gif.imagesToGif.loadingText')}
          />
        </Box>
      }
      initialValues={initialValues}
      getGroups={({ values, setValues }) => [
        {
          title: t('gif.imagesToGif.frameOptions'),
          component: (
            <Box>
              <TimingControls
                values={values}
                onChange={(next) => {
                  invalidate();
                  void setValues(next);
                }}
              />
              <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} mt={2}>
                <Button
                  variant="contained"
                  disabled={!input.length || busy || !!timingError(values)}
                  onClick={() => {
                    setCancelled(false);
                    if (!timingError(values)) create(values, input);
                  }}
                >
                  {t('gif.imagesToGif.createButton')}
                </Button>
                <Button
                  disabled={!loading}
                  onClick={() => {
                    discard();
                    setCancelled(true);
                  }}
                >
                  {t('gif.imagesToGif.cancelButton')}
                </Button>
              </Stack>
            </Box>
          )
        }
      ]}
      compute={skipAutomaticConversion}
      setInput={setInput}
    />
  );
}

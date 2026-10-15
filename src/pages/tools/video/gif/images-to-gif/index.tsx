import { Alert, Box } from '@mui/material';
import React, { useState } from 'react';
import ToolFileResult from '@components/result/ToolFileResult';
import TextFieldWithDesc from 'components/options/TextFieldWithDesc';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolMultipleImageInput, {
  MultiImageInput
} from '@components/input/ToolMultipleImageInput';
import SimpleRadio from '@components/options/SimpleRadio';
import { InitialValuesType } from './types';
import { updateNumberField } from '@utils/string';
import { useTranslation } from 'react-i18next';
import { useGifConversion } from '../../../../../features/gif-conversion/useGifConversion'; // ORVULIX: latest GIF job ownership.

const initialValues: InitialValuesType = {
  frameRateMode: 'fps',
  frameRateValue: 10
};

export default function ImagesToGif({ title }: ToolComponentProps) {
  const { t } = useTranslation('video');
  const [input, setFiles] = useState<MultiImageInput[]>([]);
  const { result, loading, error, compute, invalidate } = useGifConversion();
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
        <ToolMultipleImageInput
          value={input}
          onChange={setInput}
          type="image"
          accept={['image/*']}
          title={t('gif.imagesToGif.inputTitle')}
        />
      }
      resultComponent={
        <Box>
          {error && <Alert severity="error">{error}</Alert>}
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
      getGroups={({ values, updateField }) => [
        {
          title: t('gif.imagesToGif.frameOptions'),
          component: (
            <Box>
              <SimpleRadio
                checked={values.frameRateMode === 'fps'}
                title={t('gif.imagesToGif.frameRate')}
                description={t('gif.imagesToGif.frameRateDescription')}
                onClick={() => {
                  if (values.frameRateMode !== 'fps') {
                    invalidate();
                    updateField('frameRateMode', 'fps');
                  }
                }}
              />

              <SimpleRadio
                checked={values.frameRateMode === 'delay'}
                title={t('gif.imagesToGif.frameDelay')}
                description={t('gif.imagesToGif.frameDelayDescription')}
                onClick={() => {
                  if (values.frameRateMode !== 'delay') {
                    invalidate();
                    updateField('frameRateMode', 'delay');
                  }
                }}
              />

              <Box mt={2}>
                <TextFieldWithDesc
                  name="frameRate"
                  type="number"
                  inputProps={
                    values.frameRateMode === 'fps'
                      ? { min: 1, max: 60, step: 1 }
                      : { min: 50, max: 10000, step: 50 }
                  }
                  description={t('gif.imagesToGif.frameRateValueDescription')}
                  onOwnChange={(value) => {
                    const { min, max } =
                      values.frameRateMode === 'fps'
                        ? { min: 1, max: 60 }
                        : { min: 50, max: 10000 };

                    const clamped = Math.min(
                      max,
                      Math.max(min, Number(value))
                    ).toString();

                    if (Number(clamped) !== values.frameRateValue) {
                      invalidate();
                      updateNumberField(clamped, 'frameRateValue', updateField);
                    }
                  }}
                  value={values.frameRateValue}
                />
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

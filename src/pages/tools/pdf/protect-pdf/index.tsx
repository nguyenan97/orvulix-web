import { Alert, Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolPdfInput from '@components/input/ToolPdfInput';
import ToolFileResult from '@components/result/ToolFileResult';
import { InitialValuesType } from './types';
import { protectPdf } from './service';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { useGhostscriptJob } from '../../../../lib/ghostscript/useGhostscriptJob';

const initialValues: InitialValuesType = {
  password: '',
  confirmPassword: ''
};

export default function ProtectPdf({ title }: ToolComponentProps) {
  const [input, setInput] = useState<File | null>(null);
  const job = useGhostscriptJob(protectPdf);
  const changeInput = (file: File | null) => {
    job.invalidate();
    setInput(file);
  };

  return (
    <ToolContent
      title={title}
      toolInfo={{
        title: 'PDF processing limits',
        description:
          'Input limit: 32 MiB. Output limit: 64 MiB. Worker startup and processing deadline: 30 seconds. Ghostscript downloads its WASM engine from cdn-wasm.b-cdn.net; PDF bytes and password stay in your browser. Clear or change options to cancel the current job.'
      }}
      input={input}
      initialValues={initialValues}
      compute={job.compute}
      inputComponent={
        <ToolPdfInput
          value={input}
          onChange={changeInput}
          accept={['application/pdf']}
          title={'Input PDF'}
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
            title={'Protected PDF'}
            value={job.result}
            extension={'pdf'}
            loading={job.loading}
            loadingText={'Protecting PDF'}
          />
        </Box>
      }
      getGroups={({ values, updateField }) => [
        {
          title: 'Password Settings',
          component: (
            <Box>
              <TextFieldWithDesc
                title="Password"
                description="Enter a password to protect your PDF"
                placeholder="Enter password"
                type="password"
                value={values.password}
                onOwnChange={(value) => {
                  job.invalidate();
                  updateField('password', value);
                }}
              />
              <TextFieldWithDesc
                title="Confirm Password"
                description="Re-enter your password to confirm"
                placeholder="Confirm password"
                type="password"
                value={values.confirmPassword}
                onOwnChange={(value) => {
                  job.invalidate();
                  updateField('confirmPassword', value);
                }}
              />
            </Box>
          )
        }
      ]}
    />
  );
}

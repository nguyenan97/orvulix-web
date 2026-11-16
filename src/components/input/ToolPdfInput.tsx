import React, { useRef } from 'react';
import BaseFileInput from './BaseFileInput';
import { BaseFileInputProps } from './file-input-utils';

type PdfFileInputProps = BaseFileInputProps;

export default function ToolPdfInput({ ...props }: PdfFileInputProps) {
  const pdfRef = useRef<HTMLIFrameElement>(null);

  return (
    <BaseFileInput {...props} type={'pdf'}>
      {({ preview }) => (
        <iframe
          ref={pdfRef}
          src={preview}
          width="100%"
          height="100%"
          style={{ maxWidth: '500px' }}
        />
      )}
    </BaseFileInput>
  );
}

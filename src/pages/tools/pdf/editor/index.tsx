import React from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ExternalPdfEditor from '../../../../features/pdf-editor-consent/ExternalPdfEditor'; // ORVULIX-PRIVACY

export default function PdfEditor({ title }: ToolComponentProps) {
  return (
    <ToolContent
      title={title}
      initialValues={{}}
      getGroups={null}
      input={null}
      inputComponent={<ExternalPdfEditor />} // ORVULIX-PRIVACY
      toolInfo={{
        title: 'PDF Editor',
        description:
          'Enable the external SimplePDF editor to annotate, fill forms, sign and export PDFs. Review its data handling before opening sensitive documents.'
      }}
      compute={() => {
        /* no background compute required */
      }}
    />
  );
}

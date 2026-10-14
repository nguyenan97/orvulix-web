import React, { useRef } from 'react';
import { Box, IconButton } from '@mui/material';
import Typography from '@mui/material/Typography';
import InputHeader from '../InputHeader';
import InputFooter from './InputFooter';
import ImageIcon from '@mui/icons-material/Image';
import { useTranslation } from 'react-i18next';

import { useMultiFileImport } from '../../features/multifile-drop/useMultiFileImport'; // ORVULIX-UPSTREAM: selective #458 adaptation.
import { ImportStatus } from '../../features/multifile-drop/ImportStatus';

interface MultiImageInputComponentProps {
  accept: string[];
  title?: string;
  type: 'image';
  value: MultiImageInput[];
  onChange: (files: MultiImageInput[]) => void;
}

export interface MultiImageInput {
  file: File;
  order: number;
  preview?: string;
}

export default function ToolMultiImageInput({
  value,
  onChange,
  accept,
  title,
  type
}: MultiImageInputComponentProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importer = useMultiFileImport({
    value,
    onChange,
    accept,
    kind: 'image'
  });
  const handleFileChange = importer.pick;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = importer.clear;
  const handleRemove = importer.remove;

  function fileNameTruncate(fileName: string) {
    const maxLength = 10;
    return fileName.length > maxLength
      ? fileName.slice(0, maxLength) + '...'
      : fileName;
  }

  return (
    <Box>
      <InputHeader
        title={
          title ||
          t('toolMultipleInput.inputTitle', {
            type: type.charAt(0).toUpperCase() + type.slice(1)
          })
        }
      />
      <Box
        {...importer.handlers}
        role="region"
        aria-label="File drop zone"
        aria-busy={importer.processing}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '300px',
          border: value?.length ? 0 : 1,
          borderRadius: 2,
          boxShadow: '5',
          bgcolor: 'background.paper',
          position: 'relative'
        }}
      >
        <ImportStatus kind="image" {...importer} />
        <Box
          width="100%"
          flex={1}
          minHeight={0}
          sx={{
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            position: 'relative'
          }}
        >
          {value?.length ? (
            value.map((file, index) => (
              <Box
                key={index}
                sx={{
                  margin: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '120px',
                  border: 1,
                  borderRadius: 1,
                  padding: 1,
                  position: 'relative'
                }}
              >
                {file.preview ? (
                  <Box
                    component="img"
                    src={file.preview}
                    alt={file.file.name}
                    sx={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                  />
                ) : (
                  <ImageIcon sx={{ fontSize: 40 }} />
                )}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    mt: 0.5
                  }}
                >
                  <Typography variant="caption">
                    {fileNameTruncate(file.file.name)}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={t('toolMultipleInput.deleteFile')}
                    onClick={() => handleRemove(index)}
                  >
                    ✖
                  </IconButton>
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('toolMultipleInput.noFilesSelected')}
            </Typography>
          )}
        </Box>
      </Box>

      <InputFooter handleImport={handleImportClick} handleClear={handleClear} />
      <input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
        accept={accept.join(',')}
        onChange={handleFileChange}
        multiple
      />
    </Box>
  );
}

import { useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import Typography from '@mui/material/Typography';
import InputHeader from '../InputHeader';
import InputFooter from './InputFooter';
import ClearIcon from '@mui/icons-material/Clear';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useTranslation } from 'react-i18next';
import { useMultiFileImport } from '../../features/multifile-drop/useMultiFileImport'; // ORVULIX-UPSTREAM: selective #458 adaptation.
import { ImportStatus } from '../../features/multifile-drop/ImportStatus';

interface MultiPdfInputComponentProps {
  accept: string[];
  title?: string;
  type: 'pdf';
  value: MultiPdfInput[];
  onChange: (file: MultiPdfInput[]) => void;
}

export interface MultiPdfInput {
  file: File;
  order: number;
}

export default function ToolMultiFileInput({
  value,
  onChange,
  accept,
  title,
  type
}: MultiPdfInputComponentProps) {
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const importer = useMultiFileImport({ value, onChange, accept, kind: 'pdf' });
  const handleFileChange = importer.pick;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = importer.clear;

  function fileNameTruncate(fileName: string) {
    const maxLength = 10;
    if (fileName.length > maxLength) {
      return fileName.slice(0, maxLength) + '...';
    }
    return fileName;
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
        <ImportStatus kind="pdf" {...importer} />
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
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '200px',
                  border: 1,
                  borderRadius: 1,
                  padding: 1
                }}
              >
                <Tooltip title={file.file.name}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <PictureAsPdfIcon />
                    <Typography
                      sx={{
                        marginLeft: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {fileNameTruncate(file.file.name)}
                    </Typography>
                  </Box>
                </Tooltip>
                <Tooltip title={t('toolMultipleInput.deleteFile')}>
                  <IconButton
                    size="small"
                    aria-label={t('toolMultipleInput.deleteFile')}
                    onClick={() => {
                      importer.remove(index);
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
        multiple={true}
      />
    </Box>
  );
}

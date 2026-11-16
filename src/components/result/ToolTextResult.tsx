import { Box, CircularProgress, TextField, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import InputHeader from '../InputHeader';
import ResultFooter from './ResultFooter';
import { brand } from '../../brand/config'; // ORVULIX-BRAND
import { replaceSpecialCharacters } from '@utils/string';
import mime from 'mime';
import { writeResultText } from '../../features/text-result-clipboard/write'; // ORVULIX: visible-result clipboard contract.
import { globalInputHeight } from '../../config/uiConfig';
import { useTranslation } from 'react-i18next';

export default function ToolTextResult({
  title = 'Result',
  value,
  extension = 'txt',
  keepSpecialCharacters,
  loading,
  disabled = false
}: {
  title?: string;
  value: string;
  extension?: string;
  keepSpecialCharacters?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const displayValue = (
    keepSpecialCharacters ? value : replaceSpecialCharacters(value)
  ).replace(/\r\n?/g, '\n');
  const handleCopy = () => {
    if (disabled) return;
    writeResultText(displayValue)
      .then(() => showSnackBar(t('toolTextResult.copied'), 'success'))
      .catch((err) => {
        showSnackBar(t('toolTextResult.copyFailed', { error: err }), 'error');
      });
  };
  const handleDownload = () => {
    if (disabled) return;
    const filename = `${brand.downloadPrefix}.${extension}`;

    const mimeType = mime.getType(extension) || 'text/plain';

    const blob = new Blob([value], {
      type: mimeType
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  return (
    <Box>
      <InputHeader title={title || t('toolTextResult.result')} />
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: globalInputHeight
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            {t('toolTextResult.loading')}
          </Typography>
        </Box>
      ) : (
        <TextField
          value={displayValue}
          fullWidth
          multiline
          sx={{
            '&.MuiTextField-root': {
              backgroundColor: 'background.paper'
            }
          }}
          rows={10}
          inputProps={{ 'data-testid': 'text-result' }}
        />
      )}
      <ResultFooter
        disabled={disabled}
        handleCopy={handleCopy}
        handleDownload={handleDownload}
      />
    </Box>
  );
}

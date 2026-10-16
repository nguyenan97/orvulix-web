import { Box, TextField } from '@mui/material';
import { useContext, useRef } from 'react';
import { useTextFileImport } from '../../features/text-file-import/useTextFileImport'; // ORVULIX: cancel stale file reads.
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import InputHeader from '../InputHeader';
import InputFooter from './InputFooter';
import { useTranslation } from 'react-i18next';
import { writeResultText } from '../../features/text-result-clipboard/write'; // ORVULIX: guarded native input copy.

export default function ToolTextInput({
  value,
  onChange,
  title = 'Input text',
  placeholder
}: {
  title?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    writeResultText(value)
      .then(() => showSnackBar(t('toolTextInput.copied'), 'success'))
      .catch((err) => {
        showSnackBar(t('toolTextInput.copyFailed', { error: err }), 'error');
      });
  };
  const importer = useTextFileImport(value, onChange, (message) =>
    showSnackBar(message, 'error')
  );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  return (
    <Box>
      <InputHeader title={title || t('toolTextInput.input')} />
      <TextField
        value={value}
        onChange={(event) => importer.edit(event.target.value)}
        fullWidth
        multiline
        rows={10}
        placeholder={placeholder || t('toolTextInput.placeholder')}
        sx={{
          '&.MuiTextField-root': {
            backgroundColor: 'background.paper'
          }
        }}
        inputProps={{
          'data-testid': 'text-input'
        }}
      />
      <InputFooter handleCopy={handleCopy} handleImport={handleImportClick} />
      <input
        type="file"
        accept="*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={importer.pick}
      />
    </Box>
  );
}

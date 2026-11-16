import { Alert, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LIMITS, FileKind } from './policy';
export function ImportStatus({
  kind,
  processing,
  error,
  dragging
}: {
  kind: FileKind;
  processing: boolean;
  error: string;
  dragging: boolean;
}) {
  const { t } = useTranslation();
  const limit = LIMITS[kind];
  return (
    <>
      <Typography
        variant="caption"
        display="block"
        role="status"
        aria-live="polite"
      >
        {processing
          ? t('toolMultipleInput.processing', 'Importing files...')
          : t(
              'toolMultipleInput.dropHint',
              'Drop files here or use Select files.'
            )}{' '}
        {t('toolMultipleInput.limits', {
          defaultValue:
            'Up to {{count}} files, {{file}} MiB each, {{total}} MiB combined.',
          count: limit.count,
          file: limit.file / 1048576,
          total: limit.total / 1048576
        })}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {dragging && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            bgcolor: 'background.paper',
            opacity: 0.9,
            border: '2px dashed',
            borderColor: 'primary.main',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Typography>
            {t('toolMultipleInput.dropFiles', 'Drop files to import')}
          </Typography>
        </Box>
      )}
    </>
  );
}

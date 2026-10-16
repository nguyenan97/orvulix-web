import { useId, useState } from 'react';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Match @simplepdf/react-embed-pdf 1.9.0's default empty inline editor URL.
// This caller uses no SDK documentURL, context, callbacks or imperative actions.
export const PDF_EDITOR_URL = 'https://react-editor.simplepdf.com/en/editor';

export default function ExternalPdfEditor() {
  const [enabled, setEnabled] = useState(false);
  const headingId = useId();
  const frameId = useId();
  return (
    <Box component="section" aria-labelledby={headingId}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography id={headingId} variant="h6" component="h2">
          External PDF editor
        </Typography>
        <Typography>
          This editor is provided by SimplePDF. Enabling it connects your
          browser to SimplePDF and loads its editor and resources.
        </Typography>
        <Typography>
          SimplePDF receives analytics and document metadata, including page
          count and a document fingerprint (an identifier derived from the PDF).
          Files you open are handled by its editor under its privacy policy.
          Review these terms before using sensitive documents.
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          <Link
            href="https://simplepdf.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            SimplePDF privacy policy
          </Link>
          <Link component={RouterLink} to="/categories/pdf">
            Browse other PDF tools
          </Link>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          The editor stays off until you enable it. Closing removes it from this
          page; it cannot recall information already sent. Your choice is not
          saved.
        </Typography>
        <Box>
          <Button
            variant={enabled ? 'outlined' : 'contained'}
            aria-expanded={enabled}
            aria-controls={frameId}
            onClick={() => setEnabled((current) => !current)}
          >
            {enabled ? 'Close SimplePDF editor' : 'Enable SimplePDF editor'}
          </Button>
        </Box>
      </Stack>
      <Box id={frameId}>
        {enabled && (
          <Box
            component="iframe"
            title="SimplePDF editor (external service)"
            src={PDF_EDITOR_URL}
            referrerPolicy="no-referrer"
            sx={{ width: '100%', height: '80vh', border: 0 }}
          />
        )}
      </Box>
    </Box>
  );
}

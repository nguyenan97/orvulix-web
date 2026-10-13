import { useState } from 'react';
import { rasterHeight } from './table-header-model';
import { composeHeaderPage } from './table-headers';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { type PaginationPlan } from './pagination';
import { paginatedDocument } from './pagination-layout';
import { type PreparedHtml } from './sanitize';
import {
  ALL_PAGES,
  selectedSourcePages,
  type PageSelection
} from './page-ranges';
export default function PaginatedPreview({
  prepared,
  plan,
  white,
  selection = ALL_PAGES
}: {
  prepared: PreparedHtml;
  plan: PaginationPlan;
  white: boolean;
  selection?: PageSelection;
}) {
  const [error, setError] = useState('');
  const selected = selectedSourcePages(selection, plan.pages.length);
  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography>
        {plan.pages.length} pages - same source bounds and width-fit as export.
      </Typography>
      <Typography>
        Selected source pages: {selected.join(', ')} - {selected.length} PDF
        pages to export.
      </Typography>
      <Box sx={{ overflow: 'auto', maxHeight: 500 }}>
        {selected.map((sourcePage, index) => {
          const slice = plan.pages[sourcePage - 1];
          return (
            <Box key={sourcePage} sx={{ mb: 2 }}>
              <Typography>
                Page {sourcePage} - source {slice.start}..{slice.end} px
              </Typography>
              <Typography>
                Source page {sourcePage} - output page {index + 1} of{' '}
                {selected.length}
              </Typography>
              <Box
                data-pdf-page-preview
                sx={{
                  position: 'relative',
                  width: plan.pageWidth * 2,
                  height: plan.pageHeight * 2,
                  bgcolor: 'white',
                  outline: '1px solid #cbd5e1'
                }}
              >
                <iframe
                  title={`Paginated preview ${sourcePage}`}
                  sandbox="allow-same-origin"
                  srcDoc={paginatedDocument(prepared, slice.start)}
                  width={plan.width}
                  height={rasterHeight(slice)}
                  onLoad={(event) => {
                    const frame = event.currentTarget;
                    if (!plan.tables) return;
                    const body = frame.contentDocument?.body;
                    if (!body) {
                      setError('Preview frame is unavailable.');
                      return;
                    }
                    void composeHeaderPage(body, plan, slice, () => {
                      if (
                        !frame.isConnected ||
                        frame.contentDocument?.body !== body
                      )
                        throw new DOMException(
                          'Preview removed.',
                          'AbortError'
                        );
                    }).catch((reason) => {
                      if (
                        frame.isConnected &&
                        frame.contentDocument?.body === body
                      )
                        setError(
                          reason instanceof Error
                            ? reason.message
                            : 'Header preview failed.'
                        );
                    });
                  }}
                  style={{
                    position: 'absolute',
                    border: 0,
                    left: plan.x * 2,
                    top: plan.y * 2,
                    transform: `scale(${plan.mmPerCssPixel * 2})`,
                    transformOrigin: 'top left',
                    background: white ? 'white' : 'transparent'
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}

import { Box, Stack, Typography } from '@mui/material';
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
  const selected = selectedSourcePages(selection, plan.pages.length);
  return (
    <Stack spacing={2}>
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
                  height={slice.end - slice.start}
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

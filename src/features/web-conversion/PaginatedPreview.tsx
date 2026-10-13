import { Box, Stack, Typography } from '@mui/material';
import { type PaginationPlan } from './pagination';
import { paginatedDocument } from './pagination-layout';
import { type PreparedHtml } from './sanitize';
export default function PaginatedPreview({
  prepared,
  plan,
  white
}: {
  prepared: PreparedHtml;
  plan: PaginationPlan;
  white: boolean;
}) {
  return (
    <Stack spacing={2}>
      <Typography>
        {plan.pages.length} pages - same source bounds and width-fit as export.
      </Typography>
      <Box sx={{ overflow: 'auto', maxHeight: 500 }}>
        {plan.pages.map((slice, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography>
              Page {index + 1} - source {slice.start}..{slice.end} px
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
                title={`Paginated preview ${index + 1}`}
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
        ))}
      </Box>
    </Stack>
  );
}

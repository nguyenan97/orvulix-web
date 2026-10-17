import { Box, Link, Paper, Stack, Typography } from '@mui/material';
import {
  DEVELOPMENT_HEADING,
  DEVELOPMENT_NOTICE,
  DEVELOPMENT_UPDATES,
  PLANNED_FEATURES,
  ROADMAP_BACKLOG_HEADING,
  ROADMAP_BACKLOG_NOTICE,
  ROADMAP_BACKLOG_URL,
  ROADMAP_FOUNDATION,
  plannedFeatureSummary
} from './roadmap';

export default function RoadmapBacklog() {
  return (
    <>
      <Stack
        component="section"
        aria-labelledby="development-updates"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Typography
          id="development-updates"
          component="h2"
          variant="h5"
          fontWeight={700}
        >
          {DEVELOPMENT_HEADING}
        </Typography>
        <Typography>{DEVELOPMENT_NOTICE}</Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          {DEVELOPMENT_UPDATES.map((update) => (
            <Box component="li" key={update.title} sx={{ mb: 2 }}>
              <Typography component="h3" variant="h6">
                {update.title}
              </Typography>
              <Typography>{update.description}</Typography>
            </Box>
          ))}
        </Box>
      </Stack>
      <Stack component="section" aria-labelledby="planned-features" spacing={2}>
        <Typography
          id="planned-features"
          component="h2"
          variant="h5"
          fontWeight={700}
        >
          {ROADMAP_BACKLOG_HEADING}
        </Typography>
        <Typography>{ROADMAP_BACKLOG_NOTICE}</Typography>
        <Typography>{ROADMAP_FOUNDATION}</Typography>
        <Box
          component="ol"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
            p: 0,
            m: 0,
            listStyle: 'none'
          }}
        >
          {PLANNED_FEATURES.map((feature, index) => (
            <Paper
              component="li"
              key={feature.title}
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Typography component="h3" variant="h6" sx={{ mb: 1 }}>
                {feature.title}
              </Typography>
              <Typography>
                {plannedFeatureSummary(feature.benefit, index, feature.status)}
              </Typography>
            </Paper>
          ))}
        </Box>
        <Link
          href={ROADMAP_BACKLOG_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          View the technical backlog on GitHub
        </Link>
      </Stack>
    </>
  );
}

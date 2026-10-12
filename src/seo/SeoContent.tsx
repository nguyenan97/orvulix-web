import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SITE } from './config';
import { buildToolSections } from './content';
import type { ContentSection } from './types';
import { useToolOverrides } from './useToolOverrides';

interface SeoContentProps {
  /** Tool route path without leading slash, e.g. `json/prettify`. */
  path: string;
  /** Tool name as shown in the page heading. */
  toolName: string;
}

const listSx = { pl: 3, my: 1 } as const;

function SectionBody({ section }: { section: ContentSection }) {
  switch (section.kind) {
    case 'steps':
      return (
        <Box component="ol" sx={{ ...listSx, listStyle: 'decimal' }}>
          {section.steps?.map((step) => (
            <Typography component="li" key={step} mb={0.75}>
              {step}
            </Typography>
          ))}
        </Box>
      );
    case 'list':
      return (
        <Box component="ul" sx={{ ...listSx, listStyle: 'disc' }}>
          {section.items?.map((item) => (
            <Typography component="li" key={item} mb={0.75}>
              {item}
            </Typography>
          ))}
        </Box>
      );
    case 'examples':
      return (
        <>
          {section.examples?.map((example) => (
            <Box key={example.title} mb={1.5}>
              <Typography component="h3" fontWeight={700}>
                {example.title}
              </Typography>
              <Typography>{example.description}</Typography>
            </Box>
          ))}
        </>
      );
    case 'faq':
      return (
        <>
          {section.faq?.map((item) => (
            <Box key={item.question} mb={1.5}>
              <Typography component="h3" fontWeight={700}>
                {item.question}
              </Typography>
              <Typography>{item.answer}</Typography>
            </Box>
          ))}
        </>
      );
  }
}

/**
 * Hand-written guidance shown below a tool. It renders the same sections
 * that the build puts into the tool's static HTML, so crawlers without
 * JavaScript and users see the same content. Overrides are English, so the
 * block is only shown when the interface language is English.
 */
export default function SeoContent({ path, toolName }: SeoContentProps) {
  const { i18n } = useTranslation();
  const overrides = useToolOverrides();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const override = overrides?.[path];
  if (!override || language !== SITE.language) return null;

  return (
    <Box component="section" mt={6} maxWidth={900} data-testid="seo-content">
      {buildToolSections(toolName, override).map((section) => (
        <Box key={section.heading} mb={4}>
          <Typography component="h2" variant="h5" fontWeight={700} mb={1.5}>
            {section.heading}
          </Typography>
          <SectionBody section={section} />
        </Box>
      ))}
    </Box>
  );
}

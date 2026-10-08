import { Box } from '@mui/material';
import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet';
import { brand } from '../brand/config';
import ToolHeader from './ToolHeader';
import Separator from './Separator';
import AllTools from './allTools/AllTools';
import { getToolsByCategory } from '@tools/index';
import {
  capitalizeFirstLetter,
  getI18nNamespaceFromToolCategory
} from '../utils/string';
import { IconifyIcon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { ToolCategory } from '@tools/defineTool';
import { FullI18nKey } from '../i18n';

export default function ToolLayout({
  children,
  icon,
  i18n,
  type,
  fullPath
}: {
  icon?: IconifyIcon | string;
  type: ToolCategory;
  fullPath: string;
  children: ReactNode;
  i18n?: {
    name: FullI18nKey;
    description: FullI18nKey;
    shortDescription: FullI18nKey;
  };
}) {
  const { t } = useTranslation([
    'translation',
    getI18nNamespaceFromToolCategory(type)
  ]);

  // Use i18n keys if available, otherwise fall back to provided strings
  //@ts-ignore
  const toolTitle: string = t(i18n.name);
  //@ts-ignore
  const toolDescription: string = t(i18n.description);

  const otherCategoryTools =
    getToolsByCategory([], t)
      .find((category) => category.type === type)
      ?.tools.filter((tool) => t(tool.name) !== toolTitle)
      .map((tool) => ({
        title: tool.name,
        description: tool.shortDescription,
        link: '/' + tool.path,
        icon: tool.icon
      })) ?? [];

  return (
    <Box
      width={'100%'}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      sx={{ backgroundColor: 'background.default' }}
    >
      <Helmet>
        <title>{`${toolTitle} - ${brand.name}`}</title>
        <meta name="description" content={`${toolDescription} - Free online ${toolTitle.toLowerCase()} tool on ${brand.name}.`} />
        <link rel="canonical" href={`https://orvulix-web.netlify.app/${fullPath}`} />
        <meta property="og:title" content={`${toolTitle} - ${brand.name}`} />
        <meta property="og:description" content={toolDescription} />
        <meta property="og:url" content={`https://orvulix-web.netlify.app/${fullPath}`} />
      </Helmet>
      <Box width={'85%'}>
        <ToolHeader
          title={toolTitle}
          description={toolDescription}
          icon={icon}
          type={type}
          path={fullPath}
        />
        {children}
        <Separator backgroundColor="#5581b5" margin="50px" />
        <AllTools
          title={t('translation:toolLayout.allToolsTitle', '', {
            type: capitalizeFirstLetter(
              getToolsByCategory([], t).find(
                (category) => category.type === type
              )!.title
            )
          })}
          toolCards={otherCategoryTools}
        />
      </Box>
    </Box>
  );
}

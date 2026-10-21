import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';
export const tool = defineTool('png', {
  path: 'lossless-png',
  icon: 'mdi:file-image-check-outline',
  keywords: ['lossless', 'png', 'optimize', 'compress', 'metadata'],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'image:losslessPng.title',
    description: 'image:losslessPng.description',
    shortDescription: 'image:losslessPng.shortDescription',
    userTypes: ['developers', 'generalUsers']
  }
});

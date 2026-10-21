import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';
export const tool = defineTool('image-generic', {
  i18n: {
    name: 'image:batchOcr.title',
    description: 'image:batchOcr.description',
    shortDescription: 'image:batchOcr.shortDescription'
  },
  path: 'batch-ocr',
  icon: 'mdi:text-recognition',
  keywords: ['batch', 'ocr', 'vietnamese', 'text', 'png', 'jpeg', 'zip'],
  component: lazy(() => import('./index'))
});

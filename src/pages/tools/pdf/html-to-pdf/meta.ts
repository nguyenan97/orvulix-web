import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';
export const tool = defineTool('pdf', {
  path: 'html-to-pdf',
  icon: 'ph:file-code-thin',
  keywords: ['html', 'pdf', 'raster', 'static', 'markup'],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'pdf:htmlToPdf.title',
    description: 'pdf:htmlToPdf.description',
    shortDescription: 'pdf:htmlToPdf.shortDescription'
  }
});

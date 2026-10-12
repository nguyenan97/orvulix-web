import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('image-generic', {
  path: 'html-to-image',
  icon: 'ph:file-code-thin',
  keywords: ['html', 'png', 'jpeg', 'screenshot', 'static', 'markup'],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'image:htmlToImage.title',
    description: 'image:htmlToImage.description',
    shortDescription: 'image:htmlToImage.shortDescription'
  }
});

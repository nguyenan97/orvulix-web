import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';
export const tool = defineTool('number', {
  path: 'data-transfer-time',
  icon: 'mdi:timer-outline',
  keywords: [
    'data',
    'transfer',
    'time',
    'calculator',
    'download',
    'upload',
    'bandwidth',
    'speed',
    'duration',
    'mbps',
    'gigabit',
    'megabit'
  ],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'number:dataTransferTime.title',
    description: 'number:dataTransferTime.description',
    shortDescription: 'number:dataTransferTime.shortDescription',
    userTypes: ['developers', 'generalUsers']
  }
});

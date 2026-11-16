import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';
export const tool = defineTool('string', {
  path: 'text-workflow',
  icon: 'mdi:source-branch',
  keywords: ['workflow', 'pipeline', 'chain', 'text', 'recipe', 'transform'],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'string:textWorkflow.title',
    description: 'string:textWorkflow.description',
    shortDescription: 'string:textWorkflow.shortDescription',
    userTypes: ['generalUsers', 'developers']
  }
});

import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';
export const tool = defineTool('converters', {
  path: 'docker-run-to-compose',
  icon: 'mdi:docker',
  keywords: ['docker', 'compose', 'container', 'yaml', 'run', 'composerize'],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'converters:dockerRunCompose.title',
    description: 'converters:dockerRunCompose.description',
    shortDescription: 'converters:dockerRunCompose.shortDescription',
    userTypes: ['developers']
  }
});

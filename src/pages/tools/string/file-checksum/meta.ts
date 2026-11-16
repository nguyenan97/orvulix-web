import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';
export const tool = defineTool('string', {
  path: 'file-checksum',
  icon: 'mdi:file-check',
  keywords: [
    'file',
    'checksum',
    'hash',
    'sha256',
    'sha512',
    'sha-256',
    'sha-512',
    'integrity',
    'verify'
  ],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'string:fileChecksum.title',
    description: 'string:fileChecksum.description',
    shortDescription: 'string:fileChecksum.shortDescription',
    userTypes: ['developers', 'generalUsers']
  }
});

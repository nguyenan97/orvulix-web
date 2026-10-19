import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';
export const tool = defineTool('number', {
  path: 'ipv4-subnet-calculator',
  icon: 'mdi:ip-network-outline',
  keywords: [
    'ipv4',
    'ip',
    'subnet',
    'cidr',
    'mask',
    'network',
    'broadcast',
    'host',
    'range',
    'wildcard'
  ],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'number:ipv4Subnet.title',
    description: 'number:ipv4Subnet.description',
    shortDescription: 'number:ipv4Subnet.shortDescription',
    userTypes: ['developers', 'generalUsers']
  }
});

import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';
export const tool = defineTool('number', {
  path: 'ipv6-subnet-calculator',
  icon: 'mdi:ip-network-outline',
  keywords: [
    'ipv6',
    'ip',
    'subnet',
    'cidr',
    'prefix',
    'network',
    'address',
    'range'
  ],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'number:ipv6Subnet.title',
    description: 'number:ipv6Subnet.description',
    shortDescription: 'number:ipv6Subnet.shortDescription',
    userTypes: ['developers', 'generalUsers']
  }
});

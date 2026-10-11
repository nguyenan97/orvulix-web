export const SAMPLES = [
  {
    id: 'order',
    label: 'Order payload',
    input: {
      orderId: 'demo-1001',
      paid: true,
      total: 42.5,
      items: [{ sku: 'DEMO-A', quantity: 2 }]
    },
    explanation:
      'This authored example describes an order object. orderId is a string, paid is a boolean, total is a number and items is an array of line items. Confirm currency and quantity rules separately; a structural schema cannot verify business meaning.',
    suggestion:
      'Keep the identifier as a string. Before accepting real orders, define currency and positive-quantity rules with a full validator and business checks.'
  },
  {
    id: 'events',
    label: 'Event list',
    input: [
      { event: 'page_view', timestamp: '2026-01-01T00:00:00Z', count: 1 }
    ],
    explanation:
      'This authored example describes an array of event objects. Each event has a string name, a timestamp string and an integer count. The local validator checks structure only; it does not validate date formats.',
    suggestion:
      'Review date formatting and permitted event names separately. Do not assume a schema inferred from one event describes every future event.'
  },
  {
    id: 'settings',
    label: 'Settings payload',
    input: {
      theme: 'dark',
      notifications: false,
      language: 'en',
      backup: null
    },
    explanation:
      'This authored example describes settings with two string fields, a boolean and a null value. A null-only sample does not reveal what a future backup object should contain.',
    suggestion:
      'Review whether fields are optional and which values are allowed. The inferred schema intentionally marks observed fields as required.'
  }
] as const;

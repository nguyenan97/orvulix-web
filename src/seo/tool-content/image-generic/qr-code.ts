/**
 * SEO content for /image-generic/qr-code. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/image/generic/qr-code/index.tsx:14-54
 * - src/pages/tools/image/generic/qr-code/index.tsx:64-161,311-322; public/locales/en/image.json qrCode.groups.*
 * - src/pages/tools/image/generic/qr-code/index.tsx:423-433
 * - src/pages/tools/image/generic/qr-code/service.ts:5-59
 * - src/pages/tools/image/generic/qr-code/service.ts:66-105
 * - public/locales/en/image.json qrCode.groups.settings.correctionLevel
 * - node_modules/qrcode/lib/renderer/utils.js:1-72
 * - node_modules/qrcode/lib/renderer/canvas.js:21-63
 * - src/components/result/ToolFileResult.tsx:39-78,174-181; src/components/result/ResultFooter.tsx:24-39; public/locales/en/translation.json resultFooter
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'QR Code Generator for URL, WiFi and vCard | Orvulix',
  description:
    'Create a QR code for a URL, text, email, phone number, SMS, WiFi network or vCard. Set size, colors and error correction, then download a PNG.',
  howTo: [
    'Choose a type under "Select QR Code Type": URL, Text, Email, Phone, SMS, WiFi or vCard (Contact).',
    'Fill in the fields in the Details group for that type, for example Network Name (SSID), Password and Encryption Type for WiFi.',
    'In QR Code Settings, enter a value in the "Size in pixels (100-1000)" field, choose the Error Correction Level, and set the Background Color and Foreground Color.',
    'Wait about one second after your last change for the Generated QR code preview to update.',
    'Click Download to save qr-code.png, or click Copy to clipboard.'
  ],
  examples: [
    {
      title: 'WiFi network',
      description:
        'SSID HomeNet, password secret123, WPA -> encodes WIFI:T:WPA;S:HomeNet;P:secret123;;'
    },
    {
      title: 'Email with subject',
      description:
        'Address hello@example.com, subject "Order 42" -> encodes mailto:hello@example.com?subject=Order%2042'
    },
    {
      title: 'SMS',
      description:
        'Number +1234567890, message "Call me" -> encodes sms:+1234567890?body=Call%20me'
    }
  ],
  notes: [
    'The result is a square PNG named qr-code.png, drawn on a canvas by the qrcode library. Its width normally equals the Size value.',
    'Defaults: URL type with https://example.com, size 200, error correction M, black (#000000) on white (#FFFFFF). The library adds a quiet zone 4 modules wide.',
    'WiFi codes use the WIFI:T:<type>;S:<ssid>;P:<password>;; format, with "nopass" when Encryption Type is None. The SSID and password are inserted as typed, without escaping characters such as ; or :.',
    'vCard codes use vCard 3.0 with name, company, job title, phone, email, address and website fields.'
  ],
  faq: [
    {
      question: 'Which error correction level should I choose?',
      answer:
        'L recovers about 7% damage, M about 15% (the default), Q about 25% and H about 30%. Higher levels survive more damage but hold less data.'
    },
    {
      question: 'Can I make a QR code with a transparent background?',
      answer:
        'Yes. Type an 8-digit hex color with alpha, such as #FFFFFF00, into the Background Color text field. The qrcode library supports alpha in hex colors, and the output is a PNG.'
    },
    {
      question: 'Why is no QR code shown?',
      answer:
        'Nothing is generated while the URL or Text field is empty, or when the content is too long for the chosen error correction level. Add content, shorten it, or pick a lower level.'
    }
  ]
};

export default content;

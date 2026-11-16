export const LIMITS = {
  input: 32_768,
  tokens: 512,
  options: 128,
  output: 131_072
} as const;
export const MESSAGES = {
  input: 'Command exceeds 32,768 UTF-16 units. Shorten it before converting.',
  tokens: 'Command exceeds 512 arguments. Use a smaller command.',
  options: 'Command exceeds 128 options. Use a smaller command.',
  output: 'Compose output exceeds 131,072 UTF-16 units. Use a smaller command.',
  unicode:
    'Use well-formed Unicode text without NUL or unsupported control characters.',
  quote: 'Incomplete quote or backslash escape. Check the command syntax.',
  shell:
    'Shell expansion, operators or multiple commands are unsupported. Supply resolved values or quote literal characters.',
  prefix:
    'Start with docker run or docker container run, followed by options and an image.',
  unsupported:
    'Unsupported Docker option or syntax. No Compose output was generated. Review the supported options below.',
  value: 'A supported option has a missing or invalid value. Check its syntax.',
  duplicate:
    'Repeated singleton options or mount targets are unsupported. Keep one unambiguous value.',
  image:
    'Supply a valid supported image reference: repository[:tag] or repository@sha256:digest.',
  service:
    'Service name must start with a letter or digit and contain only letters, digits, dots, underscores or hyphens (maximum 63).',
  port: 'Invalid or unsupported port mapping. Use TCP/UDP ports 1-65535, optional host binding and equal-size ranges.',
  volume:
    'Invalid or unsupported volume. Use [absolute-path-or-name:]absolute-container-path[:ro|rw].',
  network:
    'Unsupported network configuration. Use bridge, host, none or one existing network name; host/none cannot publish ports.',
  restart:
    'Use restart no, always, unless-stopped or on-failure[:positive-retry-count].'
} as const;
export class ConversionError extends Error {
  constructor(public readonly code: keyof typeof MESSAGES) {
    super(MESSAGES[code]);
  }
}
export type Yaml = string | boolean | null | Yaml[] | { [key: string]: Yaml };
export interface Conversion {
  yaml: string;
  notices: string[];
}
export const SAMPLE = `docker run -d --name web -p 8080:80 -e 'GREETING=Hello world' -v web-data:/data --restart unless-stopped nginx:alpine`;

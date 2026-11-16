import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'Docker Run to Compose Converter | Orvulix',
  description:
    'Convert Docker run commands into Compose YAML locally. Preserve quoted values, ports, volumes and environment settings, then copy or download the result.',
  howTo: [
    'Paste one docker run or docker container run command for Linux containers.',
    'Choose the Compose service name. Use quoted literal values rather than shell expansion.',
    'Choose Convert command, then review generated YAML and any notices.',
    'Copy or download Compose YAML. Editing the command or service name clears the old result.'
  ],
  examples: [
    {
      title: 'Publish an Nginx port',
      description:
        'docker run --name web -p 8080:80 nginx:alpine produces a service using nginx:alpine with container_name web and port mapping 8080:80.'
    }
  ],
  notes: [
    'Parsing happens in this browser. No shell command, image, Docker daemon or remote conversion API is invoked. Input and output are not saved automatically.',
    'The supported subset includes ports, ro/rw volumes, environment, name, restart, one network, interactive/TTY flags and command arguments. Unsupported flags or shell expansion block output instead of dropping settings.',
    'POSIX quoting, empty quoted arguments and backslash-newline continuations are supported. PowerShell/cmd command syntax, env files and complete Docker CLI coverage are outside this MVP.',
    'Source is limited to 32,768 UTF-16 units, 512 arguments and 128 options; output is limited to 131,072 units. These admission bounds are not a hard CPU or heap quota.',
    'Literal dollars are escaped as $$ for Compose. Named volumes retain their Docker names, custom networks reference existing external networks and the default Linux network mode is bridge. Review host paths and Compose lifecycle differences before use.',
    'Downloaded YAML includes supplied environment values. Host passthrough names are resolved by the host running Compose, not by this browser.'
  ]
};
export default content;

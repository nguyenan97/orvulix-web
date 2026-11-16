import { ConversionError, LIMITS, type Conversion, type Yaml } from './model';
import { tokenize } from './tokenize';
import { image, mount, mountYaml, namePattern, port } from './values';
import { serialize } from './yaml';

const valueOptions: Record<string, string> = {
  p: 'publish',
  v: 'volume',
  e: 'env',
  publish: 'publish',
  volume: 'volume',
  env: 'env',
  name: 'name',
  restart: 'restart',
  network: 'network',
  net: 'network'
};
const booleans: Record<string, string> = {
  d: 'detach',
  i: 'interactive',
  t: 'tty',
  detach: 'detach',
  interactive: 'interactive',
  tty: 'tty'
};
export function convert(source: string, serviceName = 'app'): Conversion {
  if (serviceName.length > 63 || !namePattern.test(serviceName))
    throw new ConversionError('service');
  const args = tokenize(source);
  if (args.shift() !== 'docker') throw new ConversionError('prefix');
  if (args[0] === 'container') args.shift();
  if (args.shift() !== 'run') throw new ConversionError('prefix');
  const service: { [key: string]: Yaml } = {};
  const ports: string[] = [],
    mounts: Yaml[] = [],
    notices: string[] = [];
  const environment = new Map<string, string>();
  const volumes: { [key: string]: Yaml } = {};
  const volumeNames = new Map<string, string>();
  const targets = new Set<string>(),
    singles = new Set<string>();
  let network = 'bridge',
    count = 0,
    position = 0;
  const accept = (option: string, value: string) => {
    if (++count > LIMITS.options) throw new ConversionError('options');
    if (!['publish', 'volume', 'env'].includes(option)) {
      if (singles.has(option)) throw new ConversionError('duplicate');
      singles.add(option);
    }
    if (Object.hasOwn(booleans, option)) {
      if (!['true', 'false'].includes(value))
        throw new ConversionError('value');
      if (option === 'detach')
        notices.push(
          'Detached mode is a Compose invocation choice: use docker compose up -d when needed.'
        );
      else
        service[option === 'interactive' ? 'stdin_open' : 'tty'] =
          value === 'true';
    } else if (option === 'publish') ports.push(port(value));
    else if (option === 'env') {
      const key = value.split('=', 1)[0];
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
        throw new ConversionError('value');
      if (environment.has(key))
        notices.push('Repeated environment names use the last value.');
      if (!value.includes('='))
        notices.push(
          'Environment names without = inherit values from the host running Compose.'
        );
      environment.set(key, value);
    } else if (option === 'volume') {
      const valueMount = mount(value);
      if (targets.has(valueMount.target))
        throw new ConversionError('duplicate');
      targets.add(valueMount.target);
      let volumeSource = valueMount.source;
      if (valueMount.kind === 'volume' && volumeSource !== undefined) {
        let key = volumeNames.get(volumeSource);
        if (!key) {
          key = `volume_${volumeNames.size + 1}`;
          volumeNames.set(volumeSource, key);
          volumes[key] = { name: volumeSource };
        }
        volumeSource = key;
      }
      mounts.push(mountYaml(valueMount, volumeSource));
    } else if (option === 'name') {
      if (!namePattern.test(value)) throw new ConversionError('value');
      service.container_name = value;
    } else if (option === 'restart') {
      if (
        !/^(?:no|always|unless-stopped|on-failure(?::[1-9]\d{0,8})?)$/.test(
          value
        )
      )
        throw new ConversionError('restart');
      service.restart = value;
    } else if (option === 'network') {
      if (!namePattern.test(value)) throw new ConversionError('network');
      network = value === 'default' ? 'bridge' : value;
    }
  };
  const nextValue = () => {
    if (position >= args.length) throw new ConversionError('value');
    return args[position++];
  };
  while (position < args.length) {
    const arg = args[position];
    if (arg === '--') {
      position++;
      break;
    }
    if (!arg.startsWith('-')) break;
    position++;
    if (arg.startsWith('--')) {
      const equal = arg.indexOf('=');
      const key = arg.slice(2, equal < 0 ? undefined : equal);
      if (key.length < 2) throw new ConversionError('unsupported');
      if (Object.hasOwn(valueOptions, key))
        accept(
          valueOptions[key],
          equal < 0 ? nextValue() : arg.slice(equal + 1)
        );
      else if (Object.hasOwn(booleans, key))
        accept(booleans[key], equal < 0 ? 'true' : arg.slice(equal + 1));
      else throw new ConversionError('unsupported');
    } else {
      if (arg.length === 1) throw new ConversionError('unsupported');
      for (let index = 1; index < arg.length; index++) {
        const key = arg[index];
        if (Object.hasOwn(booleans, key)) accept(booleans[key], 'true');
        else if (Object.hasOwn(valueOptions, key)) {
          accept(
            valueOptions[key],
            index + 1 < arg.length
              ? arg.slice(index + (arg[index + 1] === '=' ? 2 : 1))
              : nextValue()
          );
          break;
        } else throw new ConversionError('unsupported');
      }
    }
  }
  if (position >= args.length) throw new ConversionError('image');
  const imageName = image(args[position++]);
  if ((network === 'host' || network === 'none') && ports.length)
    throw new ConversionError('network');
  const customNetwork = !['bridge', 'host', 'none'].includes(network);
  const document: { [key: string]: Yaml } = {
    services: {
      [serviceName]: {
        image: imageName,
        ...service,
        ...(ports.length ? { ports } : {}),
        ...(mounts.length ? { volumes: mounts } : {}),
        ...(environment.size ? { environment: [...environment.values()] } : {}),
        ...(customNetwork
          ? { networks: ['existing_network'] }
          : { network_mode: network }),
        ...(position < args.length ? { command: args.slice(position) } : {})
      }
    }
  };
  if (volumeNames.size) document.volumes = volumes;
  if (customNetwork)
    document.networks = { existing_network: { name: network, external: true } };
  return { yaml: serialize(document), notices: [...new Set(notices)] };
}

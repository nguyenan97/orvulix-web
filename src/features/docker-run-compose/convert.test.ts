import { describe, expect, it } from 'vitest';
import { convert } from './convert';
import { LIMITS } from './model';
import { image, mount, port } from './values';
import { serialize } from './yaml';

describe('Docker run to Compose', () => {
  it('emits an independently specified minimal Compose YAML', () => {
    expect(convert('docker run nginx:alpine')).toEqual({
      notices: [],
      yaml: '"services":\n  "app":\n    "image": "nginx:alpine"\n    "network_mode": "bridge"\n'
    });
  });
  it('preserves argv/empty env/Unicode/literal dollars and Boolean flags', () => {
    const result = convert(
      `docker container run -itd -e 'TEXT=Việt 😀 $HOME' --env EMPTY= --env HOST_PASSTHROUGH --name web --restart on-failure:3 alpine sh -c 'echo "$TEXT"' '' --flag`,
      'api'
    );
    expect(result.yaml).toBe(
      '"services":\n  "api":\n    "image": "alpine"\n    "stdin_open": true\n    "tty": true\n    "container_name": "web"\n    "restart": "on-failure:3"\n    "environment":\n      - "TEXT=Việt 😀 $$HOME"\n      - "EMPTY="\n      - "HOST_PASSTHROUGH"\n    "network_mode": "bridge"\n    "command":\n      - "sh"\n      - "-c"\n      - "echo \\"$$TEXT\\""\n      - ""\n      - "--flag"\n'
    );
    expect(result.notices).toHaveLength(2);
  });
  it('supports attached short values, long equals, -- separator and explicit false', () => {
    const result = convert(
      'docker run -dp8080:80 -p=9090:90 -eA=1 -e=B=2 --env=A=2 --tty=false --interactive=false -- alpine echo --name literal'
    );
    expect(result.yaml).toContain('"ports":\n      - "8080:80"');
    expect(result.yaml).toContain('- "A=2"');
    expect(result.yaml).toContain('- "B=2"');
    expect(result.yaml).toContain('- "9090:90"');
    expect(result.yaml).not.toContain('A=1');
    expect(result.yaml).toContain('"tty": false');
    expect(result.yaml).toContain('- "--name"\n      - "literal"');
    expect(result.notices).toContain(
      'Repeated environment names use the last value.'
    );
  });
  it('preserves named volumes, anonymous mounts and quoted drive bind paths', () => {
    const result = convert(
      String.raw`docker run -v data:/data:ro -v data:/other -v /tmp:/tmp:rw -v /cache -v 'C:\host files:/windows:ro' alpine`
    );
    expect(result.yaml).toContain(
      '"volumes":\n      -\n        "type": "volume"\n        "source": "volume_1"\n        "target": "/data"\n        "read_only": true'
    );
    expect(result.yaml).toContain(String.raw`"source": "C:\\host files"`);
    expect(result.yaml).toContain(
      '"bind":\n          "create_host_path": true'
    );
    expect(result.yaml).toContain(
      '"type": "volume"\n        "target": "/cache"'
    );
    expect(
      result.yaml.endsWith('"volumes":\n  "volume_1":\n    "name": "data"\n')
    ).toBe(true);
    expect(result.yaml.match(/"name": "data"/g)).toHaveLength(1);
  });
  it('preserves existing network names rather than creating project-scoped networks', () => {
    expect(convert('docker run --net default alpine').yaml).toContain(
      '"network_mode": "bridge"'
    );
    expect(convert('docker run --net company-net alpine').yaml).toContain(
      '"networks":\n  "existing_network":\n    "name": "company-net"\n    "external": true'
    );
    expect(convert('docker run --network host alpine').yaml).toContain(
      '"network_mode": "host"'
    );
  });
  it.each([
    '--p 80:80',
    '--e A=1',
    '--d',
    '--privileged',
    '--rm',
    '--env-file test.env',
    '--mount type=bind',
    '--network-alias foo',
    '--constructor x',
    '--toString x',
    '-P',
    '-x'
  ])('blocks unsupported options without emitting partial YAML %j', (flag) => {
    expect(() => convert(`docker run ${flag} alpine`)).toThrow(
      'Unsupported Docker'
    );
  });
  it.each([
    '--name',
    '-e',
    '--env=',
    '--name=',
    '--tty=maybe',
    '--name -p',
    '-e9BAD=x'
  ])('rejects invalid option values %j', (flag) => {
    expect(() => convert('docker run ' + flag)).toThrow();
  });
  it.each([
    'docker ps',
    'sudo docker run alpine',
    'docker run',
    'docker run bad/image:',
    'docker run UPPER/repo',
    'docker run -- --bad',
    'docker run --name a --name b alpine',
    'docker run -v x:/x -v y:/x alpine',
    'docker run --network host -p 80:80 alpine',
    'docker run --net container:other alpine',
    'docker run --restart invalid alpine'
  ])('rejects malformed or ambiguous commands %j', (source) => {
    expect(() => convert(source)).toThrow();
  });
  it('quotes dangerous service names as strings and keeps prototype-looking env/volume data', () => {
    const result = convert(
      'docker run -e __proto__=x -e constructor=y -v constructor:/data alpine',
      'null'
    );
    expect(result.yaml).toContain('  "null":');
    expect(result.yaml).toContain('- "__proto__=x"');
    expect(result.yaml).toContain('"name": "constructor"');
    expect(Object.prototype).not.toHaveProperty('polluted');
    for (const name of ['bad name', '__proto__', 'a'.repeat(64), ''])
      expect(() => convert('docker run alpine', name)).toThrow('Service name');
  });
  it('caps options/output exactly and recovers', () => {
    const options = Array(128).fill('-e A=1').join(' ');
    expect(convert('docker run ' + options + ' alpine').yaml).toContain('A=1');
    expect(() => convert('docker run ' + options + ' -e B=2 alpine')).toThrow(
      '128 options'
    );
    // Single scalar line: four indentation/key/quote characters plus newline.
    expect(serialize({ x: 'a'.repeat(LIMITS.output - 8) }).length).toBe(
      LIMITS.output
    );
    expect(() => serialize({ x: 'a'.repeat(LIMITS.output - 7) })).toThrow(
      '131,072'
    );
    expect(() =>
      convert("docker run alpine echo '" + '\u2028'.repeat(32000) + "'")
    ).toThrow('131,072');
    expect(convert('docker run alpine').yaml).toContain('"image": "alpine"');
  });
});
describe('value contracts', () => {
  it('preserves anonymous volume ro/rw modes', () => {
    expect(mount('/data:ro')).toEqual({
      target: '/data',
      source: undefined,
      kind: 'volume',
      readOnly: true
    });
    expect(mount('/data:rw')).toEqual({
      target: '/data',
      source: undefined,
      kind: 'volume',
      readOnly: false
    });
  });
  it.each([
    '80',
    '8080:80',
    '127.0.0.1:8000-8002:80-82/udp',
    '[::1]:8080:80/tcp'
  ])('accepts published ports %s', (value) => expect(port(value)).toBe(value));
  it.each([
    '0',
    '127.000.0.1:80:80',
    '65536',
    '80/sctp',
    '1-3:4-5',
    '999.0.0.1:80:80',
    '::1:80:80',
    'x:80',
    '80:',
    '[]:80:80'
  ])('rejects invalid/unsupported ports %s', (value) =>
    expect(() => port(value)).toThrow('port mapping')
  );
  it.each([
    './host:/data',
    'data:relative',
    'data:/data:z',
    'data::ro',
    ':/data',
    'x:/a:ro:more'
  ])('rejects unsupported mounts %s', (value) =>
    expect(() => mount(value)).toThrow('volume')
  );
  it.each([
    'alpine',
    'nginx:1.25-alpine',
    'registry.example:5000/team/app:V1',
    'alpine@sha256:' + 'a'.repeat(64)
  ])('accepts image references %s', (value) =>
    expect(image(value)).toBe(value)
  );
});

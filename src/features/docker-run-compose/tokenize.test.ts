import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize';
import { LIMITS } from './model';

describe('literal command tokenizer', () => {
  it('preserves quoted, escaped, empty and Unicode argv', () => {
    expect(
      tokenize(
        String.raw`docker run alpine sh -c 'echo "$HOME"; printf "Việt 😀"' "" a\ b x"y"'z'`
      )
    ).toEqual([
      'docker',
      'run',
      'alpine',
      'sh',
      '-c',
      'echo "$HOME"; printf "Việt 😀"',
      '',
      'a b',
      'xyz'
    ]);
    expect(tokenize('docker run alpine echo x\\ ')).toEqual([
      'docker',
      'run',
      'alpine',
      'echo',
      'x '
    ]);
    expect(tokenize(String.raw`docker run alpine "a\nb\t\$x\"z\\q"`)).toEqual([
      'docker',
      'run',
      'alpine',
      'a\\nb\\t$x"z\\q'
    ]);
  });
  it('joins POSIX continuations without inventing spaces and permits outer newlines', () => {
    expect(
      tokenize(' \r\ndocker run \\\r\n-p 80:80 alpine ec\\\nho ok\r\n')
    ).toEqual(['docker', 'run', '-p', '80:80', 'alpine', 'echo', 'ok']);
  });
  it.each(['docker run "alpine', "docker run 'alpine", 'docker run alpine \\'])(
    'rejects incomplete quoting %j',
    (source) => {
      expect(() => tokenize(source)).toThrow('Incomplete quote');
    }
  );
  it.each([
    '$HOME',
    '"$HOME"',
    '$(id)',
    '`id`',
    'a;id',
    'a&&id',
    'a|id',
    'a>file',
    '*.txt',
    '~',
    '#comment',
    'a\ndocker run alpine'
  ])('rejects execution/expansion syntax %j', (arg) => {
    expect(() => tokenize(`docker run alpine ${arg}`)).toThrow(
      'Shell expansion'
    );
  });
  it.each(['\0', '\u001b', '\uD800'])(
    'rejects unsupported characters before parsing %j',
    (character) => {
      expect(() => tokenize('docker run ' + character)).toThrow(
        'well-formed Unicode'
      );
    }
  );
  it('admits exact source/token bounds and rejects one over, then recovers', () => {
    expect(tokenize('a'.repeat(LIMITS.input))).toEqual([
      'a'.repeat(LIMITS.input)
    ]);
    expect(() => tokenize('a'.repeat(LIMITS.input + 1))).toThrow('32,768');
    expect(tokenize(Array(LIMITS.tokens).fill('x').join(' '))).toHaveLength(
      512
    );
    expect(() =>
      tokenize(
        Array(LIMITS.tokens + 1)
          .fill('x')
          .join(' ')
      )
    ).toThrow('512');
    expect(tokenize('docker run alpine')).toEqual(['docker', 'run', 'alpine']);
  });
});

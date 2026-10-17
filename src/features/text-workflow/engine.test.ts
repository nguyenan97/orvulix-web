import { describe, expect, it, vi } from 'vitest';
import { admitOutput, executeWorkflow } from './engine';
import { LIMITS, newStep, type Step } from './model';

const run = (input: string, ...steps: Step[]) =>
  executeWorkflow(input, { version: 1, steps });
describe('text workflow engine', () => {
  it('accepts exact and rejects one-over aggregate admission units', () => {
    expect(() => admitOutput(1, LIMITS.retained - 1)).not.toThrow();
    expect(() => admitOutput(1, LIMITS.retained)).toThrow(
      'Intermediate outputs exceed'
    );
    expect(() => admitOutput(LIMITS.output, 0)).not.toThrow();
    expect(() => admitOutput(LIMITS.output + 1, 0)).toThrow(
      'Step output is too large'
    );
  });
  it('runs ordered steps with independently specified intermediate outputs', () => {
    expect(
      run(
        '  hello world  ',
        newStep('trim'),
        newStep('uppercase'),
        newStep('reverse'),
        newStep('base64')
      )
    ).toEqual({
      kind: 'success',
      outputs: ['hello world', 'HELLO WORLD', 'DLROW OLLEH', 'RExST1cgT0xMRUg=']
    });
    expect(run('a b', newStep('url'), newStep('reverse'))).toEqual({
      kind: 'success',
      outputs: ['a%20b', 'b02%a']
    });
    expect(run('a b', newStep('reverse'), newStep('url'))).toEqual({
      kind: 'success',
      outputs: ['b a', 'b%20a']
    });
  });
  it('reverses graphemes including combining marks, ZWJ, skin tone and flags', () => {
    expect(run('A\u0065\u0301👩🏽‍💻🇻🇳', newStep('reverse'))).toEqual({
      kind: 'success',
      outputs: ['🇻🇳👩🏽‍💻e\u0301A']
    });
  });
  it('retains literal escapes and has a valid successful empty result', () => {
    expect(run(String.raw`a\nb\t`, newStep('trim'))).toEqual({
      kind: 'success',
      outputs: [String.raw`a\nb\t`]
    });
    expect(run('  ', newStep('trim'), newStep('base64'))).toEqual({
      kind: 'success',
      outputs: ['', '']
    });
  });
  it('adapts PR39 duplicate options, CRLF and Unicode without changing other tools', () => {
    expect(
      run(' b \r\na\r\n\r\nb\r\na\r\n', {
        type: 'deduplicate',
        options: {
          mode: 'all',
          newlines: 'preserve',
          trimTextLines: true,
          sortLines: true
        }
      })
    ).toEqual({ kind: 'success', outputs: ['\n\na\nb'] });
    expect(run('😀\n😀\nKhác', newStep('deduplicate'))).toEqual({
      kind: 'success',
      outputs: ['😀\nKhác']
    });
  });
  it('uses UTF-8 Base64 and accepts only canonical standard alphabet/padding', () => {
    expect(run('Việt 😀', newStep('base64'))).toEqual({
      kind: 'success',
      outputs: ['Vmnhu4d0IPCfmIA=']
    });
    expect(
      run('V m n h u 4 d 0 I P C f m I A=\n', {
        type: 'base64',
        options: { mode: 'decode' }
      })
    ).toEqual({ kind: 'success', outputs: ['Việt 😀'] });
  });
  it.each([
    'Zg',
    'Zg=',
    'Zh==',
    'Zm9=',
    'Zg===',
    '_w==',
    'data:text/plain;base64,Zg==',
    '!!!!',
    '===='
  ])('rejects invalid Base64 %j without leaking input', (input) => {
    expect(run(input, { type: 'base64', options: { mode: 'decode' } })).toEqual(
      { kind: 'error', outputs: [], failedStep: 0, error: 'invalid-base64' }
    );
  });
  it.each(['/w==', 'wK8=', '7aCA'])(
    'rejects invalid UTF-8 bytes %j',
    (input) => {
      expect(
        run(input, { type: 'base64', options: { mode: 'decode' } })
      ).toEqual({
        kind: 'error',
        outputs: [],
        failedStep: 0,
        error: 'invalid-utf8'
      });
    }
  );
  it('preserves UTF-8 BOM as text rather than silently dropping it', () => {
    expect(
      run('77u/QQ==', { type: 'base64', options: { mode: 'decode' } })
    ).toEqual({ kind: 'success', outputs: ['\uFEFFA'] });
  });
  it('handles URI components, failure intermediates, recovery and lone surrogates', () => {
    expect(
      run('Việt 😀 /+', newStep('url'), {
        type: 'url',
        options: { mode: 'decode' }
      })
    ).toEqual({
      kind: 'success',
      outputs: ['Vi%E1%BB%87t%20%F0%9F%98%80%20%2F%2B', 'Việt 😀 /+']
    });
    expect(
      run(
        '  %ZZ  ',
        newStep('trim'),
        { type: 'url', options: { mode: 'decode' } },
        newStep('uppercase')
      )
    ).toEqual({
      kind: 'error',
      outputs: ['%ZZ'],
      failedStep: 1,
      error: 'invalid-url'
    });
    for (const type of ['url', 'base64'] as const)
      expect(run('\uD800', newStep(type))).toEqual({
        kind: 'error',
        outputs: [],
        failedStep: 0,
        error: 'invalid-unicode'
      });
    expect(run('ok', newStep('uppercase'))).toEqual({
      kind: 'success',
      outputs: ['OK']
    });
  });
  it('handles unsupported segmentation without exposing exception details', () => {
    const segmenter = vi.spyOn(Intl, 'Segmenter').mockImplementation(() => {
      throw Error('private');
    });
    try {
      expect(run('abc', newStep('reverse'))).toEqual({
        kind: 'error',
        outputs: [],
        failedStep: 0,
        error: 'step-failed'
      });
    } finally {
      segmenter.mockRestore();
    }
  });
  it('admits exact input and rejects one-over/empty before running', () => {
    expect(run('a'.repeat(LIMITS.input), newStep('uppercase')).kind).toBe(
      'success'
    );
    expect(run('a'.repeat(LIMITS.input + 1), newStep('trim'))).toEqual({
      kind: 'error',
      outputs: [],
      failedStep: null,
      error: 'input-size'
    });
    expect(run('', newStep('trim'))).toEqual({
      kind: 'error',
      outputs: [],
      failedStep: null,
      error: 'empty-input'
    });
    expect(run('a')).toEqual({
      kind: 'error',
      outputs: [],
      failedStep: null,
      error: 'empty-steps'
    });
  });
  it('checks exact/one-over expanded URI output before allocation', () => {
    const exact = run('中'.repeat(24_576) + 'a'.repeat(40_960), newStep('url'));
    expect(exact).toEqual({
      kind: 'success',
      outputs: ['%E4%B8%AD'.repeat(24_576) + 'a'.repeat(40_960)]
    });
    expect(
      run('中'.repeat(24_576) + ' ' + 'a'.repeat(40_958), newStep('url'))
    ).toEqual({
      kind: 'error',
      outputs: [],
      failedStep: 0,
      error: 'output-size'
    });
  });
  it('caps Base64 expansion and aggregate retained outputs, then recovers', () => {
    const exact = run(
      ' '.repeat(LIMITS.input),
      newStep('url'),
      newStep('base64')
    );
    expect(exact.kind).toBe('success');
    expect(exact.outputs[1]).toBe('JTIw'.repeat(65_536));
    const expanded = run(
      ' '.repeat(LIMITS.input),
      newStep('url'),
      newStep('base64'),
      newStep('base64')
    );
    expect(expanded.kind).toBe('error');
    if (expanded.kind === 'error')
      expect([
        expanded.error,
        expanded.failedStep,
        expanded.outputs.length
      ]).toEqual(['output-size', 2, 2]);
    const sixteen = Array.from({ length: 16 }, () => newStep('uppercase'));
    expect(run('a'.repeat(LIMITS.input), ...sixteen).kind).toBe('success');
    const retained = run(
      ' '.repeat(LIMITS.input),
      newStep('url'),
      newStep('base64'),
      newStep('trim'),
      newStep('trim'),
      newStep('trim')
    );
    expect(retained.kind).toBe('error');
    if (retained.kind === 'error')
      expect([
        retained.error,
        retained.failedStep,
        retained.outputs.length
      ]).toEqual(['retained-size', 4, 4]);
    expect(run('done', newStep('trim'))).toEqual({
      kind: 'success',
      outputs: ['done']
    });
  });
});

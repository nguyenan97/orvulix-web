import { Buffer } from 'buffer';
import { UppercaseInput } from '../../pages/tools/string/uppercase/service';
import removeDuplicateLines from '../../pages/tools/string/remove-duplicate-lines/service';
import { checkRequest } from './recipe';
import { LIMITS, WorkflowError, type Step, type WorkflowResult } from './model';

export function admitOutput(length: number, retained: number) {
  if (length > LIMITS.output) throw new WorkflowError('output-size');
  if (length + retained > LIMITS.retained)
    throw new WorkflowError('retained-size');
}
function utf8Units(character: string): number {
  const point = character.codePointAt(0)!;
  if (point >= 0xd800 && point <= 0xdfff)
    throw new WorkflowError('invalid-unicode');
  return point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;
}
function transform(text: string, step: Step, retained: number): string {
  switch (step.type) {
    case 'trim':
      return text.trim();
    case 'uppercase': {
      let length = 0;
      for (const character of text) {
        length += character.toUpperCase().length;
        admitOutput(length, retained);
      }
      return UppercaseInput(text);
    }
    case 'reverse': {
      if (typeof Intl.Segmenter !== 'function')
        throw new WorkflowError('segmenter-unavailable');
      const segments = new Intl.Segmenter('en', {
        granularity: 'grapheme'
      }).segment(text);
      return Array.from(segments, (item) => item.segment)
        .reverse()
        .join('');
    }
    case 'deduplicate':
      return removeDuplicateLines(text, step.options);
    case 'base64': {
      if (step.options.mode === 'encode') {
        let bytes = 0;
        for (const character of text) {
          bytes += utf8Units(character);
          admitOutput(4 * Math.ceil(bytes / 3), retained);
        }
        return Buffer.from(text, 'utf8').toString('base64');
      }
      const source = text.replace(/[\t\n\v\f\r ]/g, '');
      if (source.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(source))
        throw new WorkflowError('invalid-base64');
      const bytes = Buffer.from(source, 'base64');
      if (bytes.toString('base64') !== source)
        throw new WorkflowError('invalid-base64');
      try {
        return new TextDecoder('utf-8', {
          fatal: true,
          ignoreBOM: true
        }).decode(bytes);
      } catch {
        throw new WorkflowError('invalid-utf8');
      }
    }
    case 'url': {
      if (step.options.mode === 'encode') {
        let length = 0;
        for (const character of text) {
          length += /^[A-Za-z0-9\-_.!~*'()]$/.test(character)
            ? 1
            : 3 * utf8Units(character);
          admitOutput(length, retained);
        }
        return encodeURIComponent(text);
      }
      try {
        return decodeURIComponent(text);
      } catch {
        throw new WorkflowError('invalid-url');
      }
    }
  }
}

/** Pure engine. The worker owns preemption; never call this in UI render. */
export function executeWorkflow(
  input: string,
  recipe: unknown
): WorkflowResult {
  let steps: Step[];
  try {
    steps = checkRequest(input, recipe).steps;
  } catch (error) {
    return {
      kind: 'error',
      outputs: [],
      failedStep: null,
      error: error instanceof WorkflowError ? error.code : 'invalid-recipe'
    };
  }
  const outputs: string[] = [];
  let retained = 0;
  for (let index = 0; index < steps.length; index++) {
    try {
      const output = transform(input, steps[index], retained);
      admitOutput(output.length, retained);
      retained += output.length;
      outputs.push(output);
      input = output;
    } catch (error) {
      return {
        kind: 'error',
        outputs,
        failedStep: index,
        error: error instanceof WorkflowError ? error.code : 'step-failed'
      };
    }
  }
  return { kind: 'success', outputs };
}

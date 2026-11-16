import { ConversionError, LIMITS } from './model';

/** POSIX literal subset only. Never expand or evaluate the command. */
export function tokenize(source: string): string[] {
  if (source.length > LIMITS.input) throw new ConversionError('input');
  for (const character of source) {
    const point = character.codePointAt(0)!;
    if (
      (point < 32 && ![9, 10, 13].includes(point)) ||
      point === 127 ||
      (point >= 0xd800 && point <= 0xdfff)
    )
      throw new ConversionError('unicode');
  }
  const tokens: string[] = [];
  let value = '',
    started = false,
    quote: 'single' | 'double' | null = null;
  const emit = () => {
    if (!started) return;
    if (tokens.length >= LIMITS.tokens) throw new ConversionError('tokens');
    tokens.push(value);
    value = '';
    started = false;
  };
  const text = source.replace(/^[\t \r\n]+/, '');
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (quote === 'single') {
      if (character === "'") quote = null;
      else value += character;
      continue;
    }
    if (character === '\\') {
      const next = text[++i];
      if (next === undefined) throw new ConversionError('quote');
      if (next === '\n') continue;
      if (next === '\r' && text[i + 1] === '\n') {
        i++;
        continue;
      }
      if (quote === 'double' && !['$', '`', '"', '\\'].includes(next))
        value += '\\';
      value += next;
      started = true;
      continue;
    }
    if (quote === 'double') {
      if (character === '"') quote = null;
      else {
        if (character === '$' || character === '`')
          throw new ConversionError('shell');
        value += character;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character === "'" ? 'single' : 'double';
      started = true;
      continue;
    }
    if (character === ' ' || character === '\t') {
      emit();
      continue;
    }
    if (
      (character === '\n' || character === '\r') &&
      /^[\t \r\n]*$/.test(text.slice(i))
    ) {
      emit();
      break;
    }
    if ('\n\r$`;|&<>(){}*?[]~#'.includes(character))
      throw new ConversionError('shell');
    value += character;
    started = true;
  }
  if (quote !== null) throw new ConversionError('quote');
  emit();
  return tokens;
}

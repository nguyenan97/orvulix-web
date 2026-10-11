import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const decoder = new TextDecoder('utf-8', { fatal: true });
const forbidden = String.fromCodePoint(0x2014);
const files = execFileSync('git', ['ls-files', '-z'], {
  encoding: 'utf8'
})
  .split('\0')
  .filter(Boolean);
let violations = 0;

for (const file of files) {
  const bytes = readFileSync(file);
  if (bytes.includes(0)) continue;
  let content;
  try {
    content = decoder.decode(bytes);
  } catch {
    continue;
  }
  content.split(/\r?\n/).forEach((line, index) => {
    if (!line.includes(forbidden)) return;
    console.error(
      `${file}:${index + 1}: replace U+2014 with a regular hyphen (-)`
    );
    violations++;
  });
}

if (violations) {
  console.error(`Text style failed: ${violations} line(s) contain U+2014.`);
  process.exitCode = 1;
} else {
  console.log('Text style passed: no U+2014 in tracked UTF-8 text files.');
}

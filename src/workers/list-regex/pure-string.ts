// Pure helpers extracted without changing native coercion or item counting.
export const specialCharMap: { [key: string]: string } = {
  '': '␀',
  ' ': '␣',
  '\n': '↲',
  '\t': '⇥',
  '\r': '␍',
  '\f': '␌',
  '\v': '␋'
};

export function isNumber(number: unknown): boolean {
  return !isNaN(parseFloat(number as string)) && isFinite(number as number);
}

/**
 * Count the occurence of items.
 * @param array - array get from user with a custom delimiter.
 * @param ignoreItemCase - boolean status to ignore the case i .
 * @returns Dict of Items count {[Item]: occcurence}.
 */
export function itemCounter(
  array: string[],
  ignoreItemCase: boolean
): { [key: string]: number } {
  const dict: { [key: string]: number } = {};
  for (const item of array) {
    let key = ignoreItemCase ? item.toLowerCase() : item;

    if (key in specialCharMap) {
      key = specialCharMap[key];
    }

    dict[key] = (dict[key] || 0) + 1;
  }
  return dict;
}

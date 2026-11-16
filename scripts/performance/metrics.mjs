/** CLS is the largest session: <1s between shifts, <5s total, excluding input shifts. */
export function clsScore(shifts) {
  let maximum = 0;
  let score = 0;
  let start = -Infinity;
  let previous = -Infinity;
  for (const shift of shifts) {
    if (shift.time - previous >= 1000 || shift.time - start >= 5000) {
      start = shift.time;
      score = 0;
    }
    score += shift.value;
    maximum = Math.max(maximum, score);
    previous = shift.time;
  }
  return maximum;
}

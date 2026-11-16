import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clsScore } from './metrics.mjs';

test('CLS uses the largest session instead of accumulating unrelated shifts', () => {
  assert.equal(clsScore([]), 0);
  assert.equal(
    clsScore([
      { time: 100, value: 0.1 },
      { time: 200, value: 0.2 },
      { time: 1400, value: 0.4 }
    ]),
    0.4
  );
  assert.equal(
    clsScore(
      Array.from({ length: 8 }, (_, i) => ({
        time: i * 900,
        value: 0.125
      }))
    ),
    0.75
  );
});

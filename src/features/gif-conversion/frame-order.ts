export function moveFrame<T>(
  frames: T[],
  index: number,
  direction: -1 | 1
): T[] {
  const destination = index + direction;
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= frames.length ||
    destination < 0 ||
    destination >= frames.length
  )
    return frames;
  const moved = [...frames];
  [moved[index], moved[destination]] = [moved[destination], moved[index]];
  return moved;
}

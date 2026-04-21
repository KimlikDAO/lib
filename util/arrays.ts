/**
 * Shufles the array uniformly at random in place.
 * @satisfies {InPlaceRandFn}
 */
const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Partitions the array into chunks of size n, except for the last chunk which
 * can be smaller, but not empty.
 *
 * For n ≤ 0, returns []
 *
 * @satisfies {PureFn}
 */
const chunk = <T>(arr: T[], n: number): T[][] => {
  if (n <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n)
    result.push(arr.slice(i, i + n));
  return result;
};

/** @satisfies {PureFn} */
const partition = <T>(
  arr: readonly T[], p: (element: T) => boolean
): [T[], T[]] => {
  const pos: T[] = [];
  const neg: T[] = [];
  for (const element of arr)
    (p(element) ? pos : neg).push(element);
  return [pos, neg];
};

/** @satisfies {InPlaceFn} */
const modify = <T>(
  arr: T[], f: (element: T, index: number) => void
): T[] => {
  for (let i = 0; i < arr.length; ++i)
    f(arr[i], i);
  return arr;
};

export {
  chunk,
  modify,
  partition,
  shuffle,
};

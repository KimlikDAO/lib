/** Shufles the array uniformly at random */
const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** 
 * Splits an array into chunks of size n.
 * @pure
 */
const chunk = <T>(arr: T[], n: number): T[][] => {
  if (n <= 0) throw 0;
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n)
    result.push(arr.slice(i, i + n));
  return result;
};

/** @pure */
const partition = <T>(
  arr: readonly T[], p: (element: T) => boolean
): [T[], T[]] => {
  const pos: T[] = [];
  const neg: T[] = [];
  for (const element of arr)
    (p(element) ? pos : neg).push(element);
  return [pos, neg];
};

export { chunk, partition, shuffle };

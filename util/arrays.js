/**
 * @template T
 * @param {T[]} arr
 * @return {T[]}
 */
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; --i) {
    /** @const {number} */
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Splits an array into chunks of size n.
 *
 * @template T
 * @param {T[]} arr
 * @param {number} n
 * @return {T[][]}
 */
const chunk = (arr, n) => {
  if (n <= 0) throw 0;
  /** @const {T[][]} */
  const result = [];
  for (let i = 0; i < arr.length; i += n)
    result.push(arr.slice(i, i + n));
  return result;
};

/**
 * @template T
 * @param {T[]} arr 
 * @param {(element: T) => boolean} p The predicate with which to partition.
 * @return {T[][]}
 */
const partition = (arr, p) => {
  /** @const {T[]} */
  const pos = [];
  /** @const {T[]} */
  const neg = [];
  for (const element of arr)
    (p(element) ? pos : neg).push(element);
  return [pos, neg];
}

export { chunk, partition, shuffle };

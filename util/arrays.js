/**
 * @template T
 * @param {!Array<T>} arr
 * @return {!Array<T>}
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
 * @param {!Array<T>} arr
 * @param {number} n
 * @return {!Array<!Array<T>>}
 */
const chunk = (arr, n) => {
  if (n <= 0) throw 0;
  /** @const {!Array<!Array<T>>} */
  const result = [];
  for (let i = 0; i < arr.length; i += n)
    result.push(arr.slice(i, i + n));
  return result;
};

export { chunk, shuffle };

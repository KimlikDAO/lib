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

export { shuffle };

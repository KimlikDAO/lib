/**
 * @template T
 * @param {number} delay
 * @param {T=} response
 * @return {Promise<T>}
 */
const wait = (delay, response) => new Promise(
  (/** @type {(val: T) => void} */ resolve) => setTimeout(() => resolve(response), delay));

/**
 * @param {number} maxConcurrent
 */
const throttle = (maxConcurrent) => {
  /**
   * @typedef {{
   *   promise: () => Promise<unknown>,
   *   resolve: (val: unknown) => void,
   *   reject: (err: unknown) => void
   * }}
   */
  const Task = {};
  /** @type {Task[]} */
  const queue = [];

  const step = () => {
    if (queue.length > 0 && maxConcurrent > 0) {
      --maxConcurrent;
      const { promise, resolve, reject } = queue.shift();
      promise()
        .finally(() => {
          ++maxConcurrent;
          step();
        })
        .then(resolve, reject);
    }
  }

  /**
   * @template T
   * @param {() => Promise<T>} promise
   * @return {Promise<T>}
   */
  const add = (promise) => new Promise((resolve, reject) => {
    queue.push({ promise, resolve, reject });
    step();
  });

  return add;
};

export {
  wait,
  throttle
};

/**
 * @template T
 * @param {number} delay
 * @param {T=} response
 * @return {!Promise<T>}
 */
const wait = (delay, response) => new Promise(
  (/** @type {function(T):void} */ resolve) => setTimeout(() => resolve(response), delay));

/**
 * @param {number} maxConcurrent
 */
const throttle = (maxConcurrent) => {
  /**
   * @typedef {{
   *   promise: function(): !Promise,
   *   resolve: function(*): void,
   *   reject: function(*): void
   * }}
   */
  const Task = {};
  /** @type {!Array<Task>} */
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
   * @param {function():!Promise<T>} promise
   * @return {!Promise<T>}
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

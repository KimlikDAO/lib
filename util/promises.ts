
const wait = <T>(delay: number, response?: T): Promise<T> => new Promise(
  (resolve: (value: T) => void) => setTimeout(() => resolve(response as T), delay)
);

const throttle = (
  maxConcurrent: number
): ((promise: () => Promise<unknown>) => Promise<unknown>) => {
  type Task = {
    promise: () => Promise<unknown>,
    resolve: (val: unknown | PromiseLike<unknown>) => void,
    reject: (err: unknown) => void,
  };
  const queue: Task[] = [];

  const step = () => {
    if (maxConcurrent > 0) {
      const task = queue.shift();
      if (!task) return;
      const { promise, resolve, reject } = task;
      --maxConcurrent;
      promise()
        .finally(() => {
          ++maxConcurrent;
          step();
        })
        .then(resolve, reject);
    }
  }

  const add = <T>(promise: () => Promise<T>): Promise<T> => new Promise((resolve, reject) => {
    queue.push({
      promise,
      resolve: resolve as (val: unknown | PromiseLike<unknown>) => void,
      reject
    });
    step();
  });

  return add;
};

export {
  wait,
  throttle
};

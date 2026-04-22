const wait = <T>(delay: number, response?: T): Promise<T> =>
  new Promise((resolve: (value: T) => void) =>
    setTimeout(() => resolve(response as T), delay),
  );

type Task = {
  promise: () => Promise<unknown>;
  resolve: (val: unknown | PromiseLike<unknown>) => void;
  reject: (err: unknown) => void;
};

class Throttle {
  private readonly queue: Task[] = [];
  private slots: number;

  constructor(maxConcurrent: number) {
    this.slots = maxConcurrent;
  }

  add<T>(promise: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        promise,
        resolve: resolve as (val: unknown | PromiseLike<unknown>) => void,
        reject,
      });
      this.step();
    }) as Promise<T>;
  }

  private step(): void {
    if (this.slots > 0) {
      const task = this.queue.shift();
      if (!task) return;
      const { promise, resolve, reject } = task;
      --this.slots;
      promise()
        .finally(() => {
          ++this.slots;
          this.step();
        })
        .then(resolve, reject);
    }
  }
}

export { Throttle, wait };

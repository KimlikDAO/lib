type Compare<T> = (a: T, b: T) => number;

class Heap<T> {
  constructor(
    readonly storage: T[],
    private readonly compare: Compare<T>,
  ) {
    this.heapify();
  }

  static empty<T>(compare: Compare<T>): Heap<T> {
    return new Heap<T>([], compare);
  }

  get length(): number {
    return this.storage.length;
  }

  get isEmpty(): boolean {
    return this.storage.length == 0;
  }

  peek(): T | undefined {
    return this.storage[0];
  }

  push(value: T): Heap<T> {
    const storage = this.storage;
    storage.push(value);
    this.siftUp(storage.length - 1);
    return this;
  }

  pop(): T | undefined {
    const storage = this.storage;
    const length = storage.length;
    if (!length) return undefined;
    const top = storage[0]!;
    const last = storage.pop()!;
    if (1 < length) {
      storage[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  clear(): Heap<T> {
    this.storage.length = 0;
    return this;
  }

  heapify(): Heap<T> {
    for (let i = (this.storage.length >> 1) - 1; 0 <= i; --i)
      this.siftDown(i);
    return this;
  }

  private siftUp(index: number) {
    const storage = this.storage;
    const compare = this.compare;
    const value = storage[index]!;
    while (index) {
      const parentIndex = (index - 1) >> 1;
      const parent = storage[parentIndex]!;
      if (compare(parent, value) <= 0) break;
      storage[index] = parent;
      index = parentIndex;
    }
    storage[index] = value;
  }

  private siftDown(index: number) {
    const storage = this.storage;
    const compare = this.compare;
    const length = storage.length;
    const value = storage[index]!;
    for (let childIndex = index * 2 + 1; childIndex < length;
      childIndex = index * 2 + 1) {
      const rightIndex = childIndex + 1;
      let child = storage[childIndex]!;
      if (rightIndex < length && compare(storage[rightIndex]!, child) < 0) {
        childIndex = rightIndex;
        child = storage[rightIndex]!;
      }
      if (compare(value, child) <= 0) break;
      storage[index] = child;
      index = childIndex;
    }
    storage[index] = value;
  }
}

export {
  Compare,
  Heap,
};

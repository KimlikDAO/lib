import { deepEquals } from "bun";

class Matcher<T> {
  constructor(private readonly actual: T) { }

  toBe(expected: T) {
    if (this.actual != expected)
      throw new Error(`Expected ${this.actual} to be ${expected}`);
  }
  toEq(expected: T) {
    if (!deepEquals(this.actual, expected))
      throw new Error(`Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`);
  }
}

class ResolvesMatcher<T> {
  constructor(private readonly actual: Promise<T>) { }

  async toBe(expected: T) {
    const resolved = await this.actual;
    if (resolved !== expected)
      throw new Error(`Expected ${resolved} to be ${expected}`);
  }
  async toEq(expected: T) {
    const resolved = await this.actual;
    if (!deepEquals(resolved, expected))
      throw new Error(`Expected ${JSON.stringify(resolved)} to equal ${JSON.stringify(expected)}`);
  }
}

class PromiseMatcher<T> {
  resolves: ResolvesMatcher<T>;

  constructor(actual: Promise<T>) {
    this.resolves = new ResolvesMatcher(actual);
  }
}

function expect<T>(actual: T): T extends Promise<infer U>
  ? PromiseMatcher<U> : Matcher<T> {
  type ReturnT = T extends Promise<infer U>
    ? PromiseMatcher<U> : Matcher<T>;
  return ((actual instanceof Promise)
    ? new PromiseMatcher(actual)
    : new Matcher(actual)) as ReturnT;
}

expect(7).toBe(7);

type User = { name: string, age: number }
const user: User = { name: "A", age: 1 };
expect(user).toEq({ name: "A", age: 1 });

const test = async () => {
  const actual = Promise.resolve("chicked");
  await expect(actual).resolves.toBe("chicken");

  const coop = Promise.resolve(user);
  await expect(coop).resolves.toEq(user);
  console.log("matchers ok");
}
test();

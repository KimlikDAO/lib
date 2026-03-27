type TestOptions = {
  /**
   * Sets the timeout for the test in milliseconds.
   *
   * If the test does not complete within this time, the test will fail with:
   * ```ts
   * 'Timeout: test {name} timed out after 5000ms'
   * ```
   *
   * @default 5000 // 5 seconds
   */
  timeout?: number;
  /**
   * Sets the number of times to retry the test if it fails.
   *
   * @default 0
   */
  retry?: number;
  /**
   * Sets the number of times to repeat the test, regardless of whether it passed or failed.
   *
   * @default 0
   */
  repeats?: number;
}

export function describe(
  description: string,
  run: () => void | Promise<unknown>
): void;

export function test(
  label: string,
  run: () => void | Promise<void>,
  options?: TestOptions
): void;

export function it(
  label: string,
  run: () => void | Promise<void>,
  options?: TestOptions
): void;

interface Matcher<T> {
  readonly not: Matcher<T>;

  toBe(expected: T): void;
  toEqual(expected: T): void;
  toBeLessThan(threshold: T): void;
  toBeGreaterThan(threshold: T): void;
  toBeFalse(): void;
  toBeFalsy(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTrue(): void;
  toBeTruthy(): void;
  toContain(expected: T): void;
  toThrow(): void;
  toBeInstanceOf(type: unknown): void;
  fail(message?: string): void;
}

interface PromiseMatcher<T> {
  readonly resolves: Matcher<T>;
  readonly rejects: Matcher<unknown>;
}

export function expect<T>(actual: T): T extends PromiseLike<infer U> ? PromiseMatcher<U> : Matcher<T>;

export function afterAll(callback: () => void): void;

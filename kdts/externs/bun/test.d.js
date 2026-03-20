/**
 * @typedef {{
 *   timeout?: number,
 *   retry?: number,
 *   repeats?: number
 * }}
 */
const TestOptions = {};

/**
 * @param {string} description
 * @param {() => void | Promise<unknown>} run
 */
const describe = function (description, run) { };

/**
 * @param {string} invariant
 * @param {() => void | Promise<void>} run
 * @param {TestOptions=} testOptions
 */
const it = function (invariant, run, testOptions) { };

/**
 * @param {string} invariant
 * @param {() => void | Promise<void>} run
 * @param {TestOptions=} testOptions
 */
const test = function (invariant, run, testOptions) { };

/**
 * @param {boolean} condition
 * @return {function(string,(function():void|function():Promise<void>),TestOptions=):void}
 */
test.if = function (condition) { }

/**
 * @template T
 * @template MATCHER := cond(isTemplatized(T) && sub(rawTypeOf(T), 'IThenable'),
 *     type('PromiseMatcher', templateTypeOf(T, 0)),
 *     type('Matcher', T))
 * =:
 * @param {T} actual
 * @return {MATCHER}
 */
const expect = function (actual) { }

/**
 * @param {() => void} callback
 */
const afterAll = function (callback) { }

/** @template T */
class Matcher {
  /** @param {T} actual */
  constructor(actual) {
    /** @const {Matcher<T>} */
    this.not;
  }

  /**
   * @param {T} expected
   * @return {void}
   */
  toBe(expected) { }

  /**
   * @param {T} expected
   * @return {void}
   */
  toEqual(expected) { }

  /**
   * @param {T} threshold
   * @return {void}
   */
  toBeLessThan(threshold) { }

  /**
   * @param {T} threshold
   * @return {void}
   */
  toBeGreaterThan(threshold) { }

  /** @return {void} */
  toBeFalse() { }

  /** @return {void} */
  toBeFalsy() { }

  /** @return {void} */
  toBeNull() { }

  /** @return {void} */
  toBeTrue() { }

  /** @return {void} */
  toBeTruthy() { }

  /**
   * @param {T} expected
   * @return {void}
   */
  toContain(expected) { }

  /** @return {void} */
  toThrow() { }

  /**
   * @param {unknown} type
   * @return {void}
   */
  toBeInstanceOf(type) { }

  /** @param {string=} message */
  fail(message) { }
}

/** @template T */
class PromiseMatcher {
  /** @param {Promise<T>} actual */
  constructor(actual) {
    /** @const {Matcher<T>} */
    this.resolves;
    /** @const {Matcher<unknown>} */
    this.rejects;
  }
}

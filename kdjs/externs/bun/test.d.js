/** @externs */

/**
 * @typedef {{
 *   timeout: (number|undefined),
 *   retry: (number|undefined),
 *   repeats: (number|undefined)
 * }}
 */
const TestOptions = {};

/**
 * @param {string} description
 * @param {function():void} run
 */
const describe = function (description, run) { };

/**
 * @param {string} invariant
 * @param {function():void|function():!Promise<void>} run
 * @param {TestOptions=} testOptions
 */
const it = function (invariant, run, testOptions) { };

/**
 * @param {string} invariant
 * @param {function():void|function():!Promise<void>} run
 * @param {TestOptions=} testOptions
 */
const test = function (invariant, run, testOptions) { };

/**
 * @template T
 * @param {T} actual
 * @return {!Matcher<T>}
 */
const expect = function (actual) { }

/**
 * @param {string=} message
 */
const fail = function (message) { }

/**
 * @template T
 * @constructor
 * @param {T} actual
 */
function Matcher(actual) { }

/** @const {!Matcher<T>} */
Matcher.prototype.not;

/**
 * @param {T} expected
 */
Matcher.prototype.toBe = function (expected) { }

/**
 * @param {T} expected
 */
Matcher.prototype.toEqual = function (expected) { }

/**
 * @param {T} threshold
 */
Matcher.prototype.toBeLessThan = function (threshold) { }

/**
 * @param {T} threshold
 */
Matcher.prototype.toBeGreaterThan = function (threshold) { }

Matcher.prototype.toBeFalse = function () { }

Matcher.prototype.toBeFalsy = function () { }

Matcher.prototype.toBeNull = function () { }

Matcher.prototype.toBeNull = function () { }

Matcher.prototype.toBeTrue = function () { }

Matcher.prototype.toBeTruthy = function () { }

/** @externs */

/**
 * @param {string} description
 * @param {function():void} run
 */
const describe = function (description, run) { };

/**
 * @param {string} invariant
 * @param {function():void} run
 */
const it = function (invariant, run) { };

/**
 * @template T
 * @param {T} actual
 * @return {Matcher<T>}
 */
const expect = function (actual) { }

/**
 * @template T
 */
function Matcher() { }

/**
 * @param {T} expected
 */
Matcher.prototype.toBe = function (expected) { }

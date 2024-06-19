/** @externs */

/**
 * @param {string} description
 * @param {function():void} run
 */
const describe = function (description, run) { };

/**
 * @param {string} invariant
 * @param {function():void|function():!Promise<void>} run
 */
const it = function (invariant, run) { };

/**
 * @template T
 * @param {T} actual
 * @return {!Matcher<T>}
 */
const expect = function (actual) { }

/**
 * @template T
 * @constructor
 * @param {T} actual
 */
function Matcher(actual) { }

/**
 * @param {T} expected
 */
Matcher.prototype.toBe = function (expected) { }

/**
 * @param {T} expected
 */
Matcher.prototype.toEqual = function (expected) { }

Matcher.prototype.toBeFalse = function () { }

Matcher.prototype.toBeFalsy = function () { }

Matcher.prototype.toBeNull = function () { }

Matcher.prototype.toBeNull = function () { }

Matcher.prototype.toBeTrue = function () { }

Matcher.prototype.toBeTruthy = function () { }

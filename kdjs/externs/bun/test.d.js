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
 * @param {function():(!Promise<*>|void)} run
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
 * @param {boolean} condition
 * @return {function(string,(function():void|function():!Promise<void>),TestOptions=):void}
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
 * @param {function(?):void} callback
 */
const afterAll = function (callback) { }

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

Matcher.prototype.toBeTrue = function () { }

Matcher.prototype.toBeTruthy = function () { }

Matcher.prototype.toThrow = function () { }

/** @param {string=} message */
Matcher.prototype.fail = function (message) { }

/**
 * @template T
 * @constructor
 * @param {!Promise<T>} actual
 */
function PromiseMatcher(actual) { }

/** @const {!Matcher<T>} */
PromiseMatcher.prototype.resolves;

/** @const {!Matcher<*>} */
PromiseMatcher.prototype.rejects;

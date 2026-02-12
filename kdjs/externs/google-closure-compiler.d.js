/**
 * @author KimlikDAO
 */

const ClosureCompiler = {};

/**
 * @dict
 * @typedef {!Object<string, (string|boolean|string[])>}
 */
ClosureCompiler.Options;

/**
 * @constructor
 * @param {ClosureCompiler.Options} options
 */
ClosureCompiler.compiler = (options) => { }

/**
 * @param {function(number,string,string):void} callback
 */
ClosureCompiler.compiler.prototype.run = function (callback) { }

/** @type {!Object<string, string>} */
ClosureCompiler.compiler.prototype.spawnOptions;

export default ClosureCompiler;

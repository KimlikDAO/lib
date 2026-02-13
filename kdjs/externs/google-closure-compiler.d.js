/**
 * @author KimlikDAO
 */

const ClosureCompiler = {};

/**
 * @dict
 * @typedef {Record<string, string | boolean | string[]>}
 */
ClosureCompiler.Options;

/**
 * @constructor
 * @param {ClosureCompiler.Options} options
 */
ClosureCompiler.compiler = (options) => { }

/**
 * @param {(arg: number, arg1: string, arg2: string) => void} callback
 */
ClosureCompiler.compiler.prototype.run = function (callback) { }

/** @type {Record<string, string>} */
ClosureCompiler.compiler.prototype.spawnOptions;

export default ClosureCompiler;

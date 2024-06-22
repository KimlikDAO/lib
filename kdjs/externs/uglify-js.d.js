/** @externs */

/** @const */
const UglifyJS = {};

/**
 * @typedef {{
 *   mangle: {
 *     toplevel: boolean
 *   },
 *   toplevel: boolean,
 *   compress: {
 *     module: boolean,
 *     toplevel: boolean,
 *     passes: number,
 *     unsafe: boolean,
 *     drop_console: boolean
 *   },
 *   warnings: string
 * }}
 */
UglifyJS.MinifyOptions = {};

/**
 * @param {string} input
 * @param {UglifyJS.MinifyOptions} options
 * @return {{
 *   code: string,
 *   warnings: (!Array<string>|undefined),
 *   error: ?,
 * }}
 */
UglifyJS.minify = (input, options) => { }

export default UglifyJS;

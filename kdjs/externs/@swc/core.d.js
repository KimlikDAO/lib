/** @const */
const swc = {};


/**
 * @typedef {{
 *   passes: number,
 *   pure_getters: boolean,
 *   unsafe: boolean,
 *   unsafe_proto: boolean,
 *   reduce_vars: boolean
 * }}
 */
swc.CompressOptions;

/**
 * @typedef {{
 *   module: boolean,
 *   sourceMap: boolean,
 *   toplevel: boolean,
 *   mangle: boolean,
 *   compress: swc.CompressOptions
 * }}
 */
swc.MinifyOptions

/**
 * @param {string} code
 * @param {swc.MinifyOptions} options
 * @return {!Promise<{ code: string }>}
 */
swc.minify = (code, options) => { }

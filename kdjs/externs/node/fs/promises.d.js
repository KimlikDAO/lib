/** @externs */

/**
 * @param {string} dirName
 * @return {!Promise<!Array<string>>}
 */
const readdir = (dirName) => { }

/**
 * @param {string} fileName
 * @param {string=} outputType
 * @return {!Promise<!Uint8Array>|!Promise<string>}
 */
const readFile = (fileName, outputType) => { }

/**
 * @param {string} fileName
 * @param {string} content
 * @return {!Promise<void>}
 */
const writeFile = (fileName, content) => { }

/**
 * @param {string} fileName
 * @param {{
 *   recursive: boolean
 * }=} options
 * @return {!Promise<void>}
 */
const mkdir = (fileName, options) => { }
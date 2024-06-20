/** @externs */

/**
 * @param {string} dirName
 * @return {!Promise<!Array<string>>}
 */
function readdir(dirName) { }

/**
 * @param {string} fileName
 * @param {string=} outputType
 * @return {!Promise<!Uint8Array>|!Promise<string>}
 */
function readFile(fileName, outputType) { }

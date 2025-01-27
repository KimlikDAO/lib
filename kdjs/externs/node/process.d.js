/** @const */
const process = {};

/**
 * @param {number} exitCode
 */
process.exit = (exitCode) => { }

/**
 * @return {string}
 */
process.cwd = () => { };

/**
 * @param {string} event
 * @param {function(*)} handler
 */
process.on = (event, handler) => { }

/** @const {!Array<string>} */
process.argv;

/** @const {!Object<string, string>} */
process.env;

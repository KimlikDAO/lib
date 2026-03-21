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
 * @param {string} eventType
 * @param {(event: unknown) => void} handler
 */
process.on = (eventType, handler) => { }

/** @type {string[]} */
process.argv;

/** @type {Record<string, string>} */
process.env;

/** @type {number} */
process.exitCode;

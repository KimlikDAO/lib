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

/** @const {string[]} */
process.argv;

/** @const {Record<string, string>} */
process.env;

/** @type {number} */
process.exitCode;

/** @const {string} */
const Red = "\x1b[41m";
/** @const {string} */
const Green = "\x1b[42m";
/** @const {string} */
const Blue = "\x1b[44m";
/** @const {string} */
const Clear = "\x1b[0m";

/** @typedef {Record<string, string | boolean | string[]>} */
const CliArgs = {};

/**
 * @param {string[]} args
 * @param {string} defaultArgKey
 * @param {Record<string, string>} shortArgMap
 * @return {CliArgs}
 */
const parseArgs = (args, defaultArgKey, shortArgMap) => {
  /** @type {string} */
  let key = defaultArgKey;
  /** @type {string[]} */
  let values = [];
  /** @type {Record<string, unknown>} */
  const params = {};

  args.push("--");
  for (const arg of args) {
    if (arg.startsWith("-")) {
      params[key] = values.length ? values.length == 1 ? values[0] : values : true;
      key = arg.startsWith("--") ? arg.slice(2) : shortArgMap[arg];
      values = [];
    } else
      values.push(arg)
  }
  return params;
}

export {
  Blue,
  Clear,
  CliArgs,
  Green,
  Red,
  parseArgs
};

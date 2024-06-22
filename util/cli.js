/** @const {string} */
const Red = "\x1b[41m";
/** @const {string} */
const Green = "\x1b[42m";
/** @const {string} */
const Clear = "\x1b[0m";

/** @typedef {!Object<string, (string|boolean)>} */
const CliArgs = {};

/**
 * @param {!Array<string>} args
 * @param {string} defaultArgKey
 * @param {!Object<string, string>} shortArgKeys
 * @return {!Object<string, (string|boolean)>}
 */
const parseArgs = (args, defaultArgKey, shortArgKeys) => {
  /** @type {string} */
  let key = defaultArgKey;
  /** @type {!Array<string>} */
  let values = [];
  /** @type {!Object} */
  const params = {};

  args.push("--");
  for (const arg of args) {
    if (arg.startsWith("-")) {
      params[key] = values.length ? values.length == 1 ? values[0] : values : true;
      key = arg.startsWith("--") ? arg.slice(2) : shortArgKeys[arg];
      values = [];
    } else
      values.push(arg)
  }
  return params;
}

export {
  Clear,
  CliArgs,
  Green,
  Red,
  parseArgs
};


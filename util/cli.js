/**
 * @constructor
 * @dict
 */
const CliArgs = function () { };

/**
 * @param {!Array<string>} args
 * @param {string} defaultArgKey
 * @param {!Object<string, string>} shortArgKeys
 * @return {!CliArgs}
 */
const parseArgs = (args, defaultArgKey, shortArgKeys) => {
  /** @type {string} */
  let key = defaultArgKey;
  /** @type {!Array<string>} */
  let values = [];
  /** @type {!CliArgs} */
  const params = new CliArgs();

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
  CliArgs,
  parseArgs
};

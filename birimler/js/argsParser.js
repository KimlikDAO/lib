/**
 * @constructor
 * @dict
 */
const Params = function () {
  /** @const {!Array<string>} */
  this.inputs = [];
  /** @type {string} */
  this.output;
};

/** @const {!Object<string, string>} */
const ShortArgs = {
  "-o": "output"
};

/**
 * @param {!Array<string>} args
 * @return {!Params}
 */
const argsToParams = (args) => {
  /** @type {string} */
  let key = "inputs";
  /** @type {!Array<string>} */
  let values = [];
  /** @type {!Params} */
  const params = new Params();

  args.push("--");
  for (let arg of args) {
    if (arg.startsWith("-")) {
      params[key] = values.length ? values.length == 1 ? values[0] : values : true;
      key = arg.startsWith("--") ? arg.slice(2) : ShortArgs[arg];
      values = [];
    } else
      values.push(arg)
  }
  return params;
}

export {
  Params,
  argsToParams
};

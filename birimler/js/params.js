import { CliArgs, parseArgs } from "../../util/cli";

/**
 * @param {string} fileName
 * @return {string} directory of the fileName
 */
const getDir = (fileName) => fileName.slice(0, fileName.lastIndexOf("/"));

/**
 * @typedef {!CliArgs}
 */
const Params = {};

/**
 * @param {!Array<string>} args
 * @return {!Params}
 */
const getParams = () => {
  /** @const {!Params} */
  const params = parseArgs(process.argv.slice(2), "inputs", { "-o": "output" });
  params["isolateDir"] = getDir(params["output"]) + "/isolate/";
  return params;
}

export {
  Params,
  getParams
};

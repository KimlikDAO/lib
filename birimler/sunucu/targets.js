import { compile } from "../../kdjs/compile";
import { ensureDotJs, selectDefines } from "../defines";

/**
 * @param {string} dirName
 * @param {{
 *   entry: string,
 *   defines: !Array<string|({
 *     module: string,
 *     value: string
 *   })>
 * }} config
 * @param {!Object=} env
 * @return {!Promise<string>}
 */
const compileWorker = async (dirName, config, env) => {
  /** @const {string} */
  const entry = ensureDotJs(`${dirName}/${config.entry}`);
  const compileParams = {
    entry,
    output: `build/${entry}`,
  };
  if (config.defines)
    compileParams.define = selectDefines(entry.slice(0, -3), config.defines, env);
  return compile(compileParams);
}

export {
  compileWorker
};

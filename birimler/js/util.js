import yaml from "js-yaml";
import { readFile } from "node:fs/promises";
import { combine } from "../../util/paths";

/**
 * @param {string} str
 * @return {string}
 */
const ensureDotJs = (str) => str.endsWith(".js") ? str : str + ".js";

/**
 * @param {string} str
 * @return {string}
 */
const removeDotJs = (str) => str.endsWith(".js") ? str.slice(0, -3) : str;

/**
 * @param {string} definesFile
 * @param {string} module
 * @return {!Promise<!Array<string>>}
 */
const readDefines = (definesFile, module) => readFile(definesFile)
  .then(
    (fileContent) => {
      const moduleName = module.replaceAll("/", "$");
      return Object.entries(yaml.load(fileContent)).map(
        ([key, value]) => `${key}$$module$${moduleName}="${value}"`)
    },
    () => []
  )

const selectDefines = (module, defines, env) => {
  const out = [];
  for (const define of defines) {
    const [mod, key] = typeof define == "string"
      ? [module, define]
      : [removeDotJs(define.module.startsWith("/")
        ? define.module.slice(1)
        : combine(module, "../" + define.module)), define.value];

    let val = env;
    if (env)
      for (const k of key.split("."))
        val = val[k];

    /** @const {string} */
    const varName = key.replaceAll(".", "_").toUpperCase();
    out.push(`${varName}$$module$${mod.replaceAll("/", "$")}=${JSON.stringify(val)}`);
  }
  return out;
}

/**
 * @param {string} module
 * @param {string} name
 * @param {string} value
 * @return {string}
 */
const define = (module, name, value) =>
  `${name}$$module$${module.replaceAll("/", "$")}=${value}`;

export {
  define,
  ensureDotJs,
  readDefines,
  removeDotJs,
  selectDefines
};

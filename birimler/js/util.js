import { readFile } from "node:fs/promises";
import toml from "toml";

/**
 * @param {string} definesFile
 * @param {string} module
 * @return {!Promise<!Array<string>>}
 */
const readDefines = (definesFile, module) => readFile(definesFile)
  .then(
    (fileContent) => {
      const moduleName = module.replaceAll("/", "$");
      return Object.entries(toml.parse(fileContent)).map(
        ([key, value]) => `${key}$$module$${moduleName}="${value}"`)
    },
    () => []
  )

/**
 * @param {string} module
 * @param {string} name
 * @param {string} value
 * @return {string}
 */
const define = (module, name, value) =>
  `${name}$$module$${module.replaceAll("/", "$")}=${value}`;

export { define, readDefines };

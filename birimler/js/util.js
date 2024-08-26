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
      const moduleName = module.replace("/", "$");
      return Object.entries(toml.parse(fileContent)).map(
        ([key, value]) => `${key}$$module$${moduleName}="${value}"`)
    },
    () => []
  )

export { readDefines };

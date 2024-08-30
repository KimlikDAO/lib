import yaml from "js-yaml";
import { readFile, readdir } from "node:fs/promises";
import "./crate.d";

/**
 * @param {string} crateName
 * @return {!Promise<!Object>}
 */
const readCrateRecipe = (crateName) => readdir(crateName)
  .then((/** !Array<string> */ dir) => {
    for (const file of dir) {
      if (!file.startsWith(".") && file.endsWith(".yaml"))
        return readFile(`${crateName}/${file}`)
          .then((content) => yaml.load(content));
    }
    return Promise.reject();
  });

export { readCrateRecipe };

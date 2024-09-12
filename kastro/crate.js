import yaml from "js-yaml";
import { readFile, readdir } from "node:fs/promises";
import { I18nString, LangCode } from "../util/i18n";

/**
 * @typedef {{
 *   index: string,
 *   codebaseLang: LangCode,
 *   pages: !Array<I18nString>
 * }}
 */
const CrateRecipe = {};

/**
 * @param {string} crateName
 * @return {!Promise<CrateRecipe>}
 */
const readCrateRecipe = (crateName) => readdir(crateName)
  .then((/** !Array<string> */ dir) => {
    for (const file of dir) {
      if (!file.startsWith(".") && file.endsWith(".yaml"))
        return readFile(`${crateName}/${file}`)
          .then((content) => /** @type {CrateRecipe} */(yaml.load(content)));
    }
    return Promise.reject();
  });

export {
  CrateRecipe,
  LangCode,
  readCrateRecipe
};

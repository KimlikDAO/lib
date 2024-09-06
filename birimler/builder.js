#!/usr/bin/env bun
import yaml from "js-yaml";
import { readFile } from "node:fs/promises";
import { uploadWorker } from "./cloudflare/targets";
import { readCrateRecipe } from "./crate";
import { sayfaOku } from "./sayfa/eskiOkuyucu";
import { compileWorker } from "./sunucu/targets";

/** @define {string} */
const ROOT_PATH = "../../..";

/**
 * @param {string} createDir
 * @param {!Object} env
 */
const buildCrate = (createDir, env) => import(`${ROOT_PATH}/${createDir}/build.js`)
  .then((buildFile) => buildFile.default && buildFile.default.build
    ? buildFile.default.build(env)
    : Promise.reject())
  .catch(() => readCrateRecipe(createDir)
    .then((recipe) => {
      const tasks = [];
      if (recipe.dizin) {
        const pages = [].concat({
          en: "en",
          tr: "tr",
          konum: `${recipe.dizin}/sayfa.html`
        }, recipe.sayfalar);

        for (const lang of ["tr", "en"])
          for (const page of pages) {
            page.konum ||= `${page.tr}/sayfa.html`;
            tasks.push(sayfaOku({ ...page, dil: lang }));
          }
      }

      if (recipe.worker)
        compileWorker(createDir, recipe.worker, env);
    })
  );

/**
 * @param {string} createDir
 * @param {!Object} env
 */
const deployCrate = (createDir, env) => import(`${createDir}/build.js`)
  .then(
    (buildFile) => buildFile.default.deploy(env),
    () => readCrateRecipe(createDir)
      .then((recipe) => {
        if (recipe.worker)
          return compileWorker(createDir, recipe.worker)
            .then((code) => uploadWorker(env.cloudflare.auth, recipe.worker.name, code))
      })
  );

/** @dict */
const env = yaml.load(await readFile(".gizli.yaml", "utf8").catch(() => ""));
/** @const {string} */
const crate = process.argv[2] || ".";
/** @const {boolean} */
const isDeploy = process.argv[3] == "deploy";

isDeploy
  ? deployCrate(crate, env)
  : buildCrate(crate, env);

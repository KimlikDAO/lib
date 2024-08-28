#!/usr/bin/env bun
import yaml from "js-yaml";
import { readFile, readdir } from "node:fs/promises";
import { uploadWorker } from "./cloudflare/targets";
import { compileWorker } from "./js/targets";

/** @define {string} */
const ROOT_PATH = "../../..";

/**
 * @param {string} dirName
 * @return {!Promise<!Object>}
 */
const readBuildRecipe = (dirName) => readdir(dirName)
  .then((/** !Array<string> */ dir) => {
    for (const file of dir) {
      if (!file.startsWith(".") && file.endsWith(".yaml"))
        return readFile(`${dirName}/${file}`)
          .then((content) => yaml.load(content));
    }
    return Promise.reject();
  });

/**
 * @param {string} dirName
 * @param {!Object} env
 */
const buildCrate = (dirName, env) => import(`${ROOT_PATH}/${dirName}/build.js`)
  .then((buildFile) => buildFile.default && buildFile.default.build
    ? buildFile.default.build(env)
    : Promise.reject())
  .catch(() => readBuildRecipe(dirName)
    .then((recipe) => {
      if (recipe.dizin)
        buildSayfa()
      if (recipe.worker)
        compileWorker(dirName, recipe.worker, env);
    })
  );

/**
 * @param {string} dirName
 * @param {!Object} env
 */
const deployCrate = (dirName, env) => import(`${dirName}/build.js`)
  .then(
    (buildFile) => buildFile.default.deploy(env),
    () => readBuildRecipe(dirName)
      .then((recipe) => {
        if (recipe.worker)
          return compileWorker(dirName, recipe.worker)
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

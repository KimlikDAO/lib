#!/usr/bin/env bun
import yaml from "js-yaml";
import { readFile } from "node:fs/promises";
import { uploadWorker } from "./cloudflare/targets";
import { BuildMode } from "./compiler/compiler";
import { compilePage } from "./compiler/page";
import { compileWorker } from "./compiler/worker";
import { readCrateRecipe } from "./crate";

/** @define {string} */
const ROOT_PATH = "../../..";

/**
 * @param {string} createDir
 * @param {!Object} env
 */
const buildCrate = (createDir, env) => readCrateRecipe(createDir)
  .then((crate) => {
    const tasks = [];
    /** @const {!Array<string>} */
    const langs = crate.pages ? Object.keys(crate.pages[0]) : crate.languages;

    if (crate.index) {
      /**
       * Given a page, schedules the compilation of it in all languages of the
       * crate.
       *
       * @param {I18nString} page a page defined by its routes
       * @param {string=} rootComponent 
       */
      const buildPage = (page, rootComponent) => {
        for (const lang of langs) {
          const pageData = {
            BuildMode: BuildMode.Dev, // TODO(KimlikDAO-bot): fix
            Lang: lang,
            CodebaseLang: crate.codebaseLang,
            Route: { ...page }
          };
          delete pageData.Route[lang];
          tasks.push(compilePage(rootComponent || page[crate.codebaseLang], pageData));
        }
      }

      buildPage(Object.fromEntries(langs.map(lang => [lang, lang])), crate.index);
      // if (crate.pages)
      //   for (const page of crate.pages)
      //     buildPage(page);
    }

    if (crate.worker)
      compileWorker(crate.worker.name, crate.worker, env);
  });

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

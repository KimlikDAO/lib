import * as swc from "@swc/core";
import ClosureCompiler from "google-closure-compiler";
import { writeFile } from "node:fs/promises";
import UglifyJS from "uglify-js";
import { ImportStatement } from "./modules";
import { tweakPasses } from "./passes";
import { postprocess } from "./postprocess";
import { preprocessAndIsolate } from "./preprocess";

/** @typedef {!Object<string, *>} */
const Params = {};

/**
 * @param {!Params} params
 * @param {function(!Array<string>):!Promise<boolean>=} checkFreshFn
 * @param {function(string,string,boolean=):?string=} transpileFn
 * @return {!Promise<string|void>}
 */
const compile = async (params, checkFreshFn, transpileFn) => {
  const {
    /** @const {!Map<string, ImportStatement>} */ unlinkedImports,
    /** @const {!Set<string>} */ allFiles,
    /** @const {string} */ isolateDir,
    /** @const {boolean} */ ignoreUnusedLocals
  } = await preprocessAndIsolate(params, transpileFn);
  /** @const {!Array<string>} */
  const allFilesArray = Array.from(allFiles).sort();
  if (checkFreshFn && await checkFreshFn(allFilesArray))
    return;

  /** @const {!Array<string>} */
  const jsCompErrors = [
    "unusedLocalVariables",
    "checkTypes",
    "missingProperties",
    "strictCheckTypes",
  ];
  /** @const {!Array<string>} */
  const jsCompWarnings = [];
  if (params["strict"])
    jsCompWarnings.push("reportUnknownTypes");
  if (params["loose"])
    jsCompErrors.pop();
  if (ignoreUnusedLocals)
    jsCompErrors.shift();

  /** @const {ClosureCompiler.Options} */
  const options = {
    "js": allFilesArray,
    "compilation_level": "ADVANCED",
    "charset": "utf-8",
    "warning_level": "verbose",
    "emit_use_strict": false,
    "rewrite_polyfills": false,
    "assume_function_wrapper": true,
    "jscomp_error": jsCompErrors,
    "jscomp_warning": jsCompWarnings,
    "language_in": "UNSTABLE",
    "chunk_output_type": "ES_MODULES",
    "module_resolution": "NODE",
    "dependency_mode": "PRUNE",
    "entry_point": /** @type {string} */(params["entry"]),
  };
  if (params["define"])
    options["define"] = /** @type {(!Array<string>|boolean|string)} */(params["define"]);

  const closureCompiler = new ClosureCompiler.compiler(options);
  closureCompiler.spawnOptions = {
    "cwd": isolateDir
  };

  return new Promise((resolve, reject) => {
    closureCompiler.run((exitCode, output, errors) => {
      if (exitCode || errors) {
        reject(errors);
        return;
      }
      output = postprocess(output, unlinkedImports);
      if (params["printGccOutput"])
        console.log("GCC output:", output);
      const uglified = UglifyJS.minify(output, {
        mangle: {
          toplevel: true,
        },
        toplevel: true,
        compress: {
          // evaluate: "eager",
          module: true,
          toplevel: true,
          passes: 4,
          unsafe: true,
          drop_console: /** @type {boolean} */(params["nologs"]),
        },
        warnings: "verbose",
      });
      console.log(`GCC size:     \t${output.length}`);
      console.log(uglified.warnings, uglified.error);
      /** @const {string} */
      const uglifiedCode = tweakPasses(uglified.code);
      const swcOutputPromise = swc.minify(uglifiedCode, {
        module: true,
        sourceMap: false,
        toplevel: true,
        mangle: true,
        compress: {
          passes: 10,
          pure_getters: true,
          unsafe: true,
          unsafe_proto: true,
          reduce_vars: true,
        }
      });
      resolve(Promise.all([uglifiedCode, swcOutputPromise]));
    })
  }).then(([uglifiedCode, swcOutput]) => {
    console.log(`Uglified size:\t${uglifiedCode.length}`);
    console.log(`SWC size:     \t${swcOutput.code.length}`);
    /** @type {string} */
    let code = uglifiedCode.length < swcOutput.code.length
      ? uglifiedCode : swcOutput.code;
    if (/** @type {boolean} */(params["emit_shebang"]))
      code = "#!/usr/bin/env bun\n" + code;
    if (params["print"]) console.log("UglifyJS\n", uglifiedCode, "\nSWC\n", swcOutput.code);
    if (params["output"])
      return writeFile(/** @type {string} */(params["output"]), code)
        .then(() => code)
    return code;
  })
}

export { compile };

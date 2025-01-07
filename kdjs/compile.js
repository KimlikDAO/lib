import ClosureCompiler from "google-closure-compiler";
import { writeFile } from "node:fs/promises";
import UglifyJS from "uglify-js";
import { combine, getDir } from "../util/paths";
import { removeStringNamedExports } from "./passes";
import { ImportStatement } from "./modules";
import { postprocess } from "./postprocess";
import { preprocessAndIsolate } from "./preprocess";

/** @typedef {!Object<string, *>} */
const Params = {};

/**
 * @param {*} globals
 * @return {!Object<string, *>}
 */
const getGlobals = (globals) => /** @type {!Object<string, *>} */(typeof globals == "string"
  ? JSON.parse(globals) : (globals || {}));

/**
 * @param {!Params} params
 * @param {function(!Array<string>):!Promise<boolean>=} checkFreshFn
 * @return {!Promise<string|void>}
 */
const compile = async (params, checkFreshFn) => {
  /** @const {string} */
  const isolateDir = combine(
    getDir(/** @type {string} */(params["output"] || "build/" + /** @type {string} */(params["entry"]))),
    /** @type {string} */(params["isolateDir"]) || ".kdjs_isolate");
  const {
    /** @const {!Map<string, ImportStatement>} */ unlinkedImports,
    /** @const {!Set<string>} */ allFiles
  } = await preprocessAndIsolate(
    /** @type {string} */(params["entry"]),
    isolateDir,
    [].concat(params["externs"] || []),
    getGlobals(params["globals"])
  );
  /** @const {!Array<string>} */
  const allFilesArray = Array.from(allFiles).sort();
  if (checkFreshFn && await checkFreshFn(allFilesArray))
    return;

  /** @const {!Array<string>} */
  const jsCompErrors = [
    "checkTypes",
    "unusedLocalVariables",
    "missingProperties",
    "strictCheckTypes",
  ];
  /** @const {!Array<string>} */
  const jsCompWarnings = [];
  if (params["strict"])
    jsCompWarnings.push("reportUnknownTypes");
  if (params["loose"])
    jsCompErrors.pop();

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
    "module_resolution": "NODE",
    "dependency_mode": "PRUNE",
    "entry_point": /** @type {string} */(params["entry"]),
    "chunk_output_type": "ES_MODULES"
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
      if (params["printGccOutput"])
        console.log("GCC output:", output);
      output = postprocess(output, unlinkedImports);
      const uglified = UglifyJS.minify(output, {
        mangle: {
          toplevel: true,
        },
        toplevel: true,
        compress: {
          // evaluate: "eager",
          module: true,
          toplevel: true,
          passes: 3,
          unsafe: true,
          drop_console: /** @type {boolean} */(params["nologs"]),
        },
        warnings: "verbose",
      });
      const uglifiedCode = removeStringNamedExports(uglified.code);
      console.log(params["entry"]);
      console.log(`Uglified size:\t${uglifiedCode.length}\nGCC size:\t${output.length}`);
      let code = uglifiedCode.length < output.length ? uglifiedCode : output;
      if (/** @type {boolean} */(params["emit_shebang"]))
        code = "#!/usr/bin/env bun\n" + code;
      console.log(uglified.warnings, uglified.error);
      if (params["print"]) console.log(code);
      if (params["output"])
        writeFile(/** @type {string} */(params["output"]), code)
          .then(() => resolve(code))
      else resolve(code);
    });
  })
}

export { compile };

import ClosureCompiler from "google-closure-compiler";
import { writeFile } from "node:fs/promises";
import UglifyJS from "uglify-js";
import { combine, getDir } from "../util/paths";
import { ImportStatement } from "./modules";
import { tweakPasses } from "./passes";
import { postprocess } from "./postprocess";
import { preprocessAndIsolate } from "./preprocess";

/** @typedef {!Object<string, *>} */
const Params = {};

/**
 * @param {!Params} params
 * @param {function(!Array<string>):!Promise<boolean>=} checkFreshFn
 * @param {DomIdMapper=} domIdMapper
 * @return {!Promise<string|void>}
 */
const compile = async (params, checkFreshFn, domIdMapper) => {
  const {
    /** @const {!Map<string, ImportStatement>} */ unlinkedImports,
    /** @const {!Set<string>} */ allFiles,
    /** @const {string} */ isolateDir,
    /** @const {boolean} */ ignoreUnusedLocals
  } = await preprocessAndIsolate(params);
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
      const uglifiedCode = tweakPasses(uglified.code);
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

import * as swc from "@swc/core";
import { build, write } from "bun";
import { compiler as ClosureCompiler } from "google-closure-compiler";
import UglifyJS from "uglify-js";
import { tweakPasses } from "./passes";
import { postprocess } from "./postprocess";
import { preprocessAndIsolate } from "./preprocess";
import { ImportStatement } from "./util/modules";
import { kdjsPlugin } from "./util/plugin";

/** @typedef {Record<string, unknown>} */
const Params = {};

const compileWithBun = async (params) => {
  const result = await build({
    entrypoints: [params["entry"]],
    format: "esm",
    target: "bun",
    packages: "external",
    minify: true,
    plugins: [kdjsPlugin],
  });
  if (!result.success) {
    const messages = result.logs.map((l) => l.message).join("\n");
    throw `Bun build failed: ${messages}`;
  }
  const text = await result.outputs[0].text();
  console.log(`bun build size:\t${text.length}`);
  if (params["print"])
    console.log("bun build output:\n", text);
  return params["output"]
    ? write(params["output"], text).then(() => text)
    : text;
};

/**
 * Resolves to the compiled code or void if it determines that the code
 * is up to date.
 * On error, rejects with the error.
 *
 * @param {Params} params
 * @param {(string[]) => Promise<boolean>=} checkFreshFn
 * @param {(content: string, file: string, isEntry: boolean=) => string | null=} transpileFn
 * @return {Promise<string | void>}
 */
const compile = async (params, checkFreshFn, transpileFn) => {
  if (params["fast"])
    return compileWithBun(params);

  const {
    /** @type {Map<string, ImportStatement>} */ unlinkedImports,
    /** @type {Set<string>} */ allFiles,
    /** @type {string} */ isolateDir,
    /** @type {boolean} */ ignoreUnusedLocals
  } = await preprocessAndIsolate(params, transpileFn);
  /** @const {string[]} */
  const allFilesArray = Array.from(allFiles).sort();
  if (checkFreshFn && await checkFreshFn(allFilesArray))
    return;

  /** @const {string[]} */
  const jsCompErrors = [
    "unusedLocalVariables",
    "checkTypes",
    "missingProperties",
    "strictCheckTypes",
  ];
  /** @const {string[]} */
  const jsCompWarnings = [];
  if (params["strict"])
    jsCompWarnings.push("reportUnknownTypes");
  if (params["loose"])
    jsCompErrors.pop();
  if (ignoreUnusedLocals)
    jsCompErrors.shift();

  /** @const {Object<string, string|boolean|string[]>} */
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
    "language_out": "UNSTABLE",
    "chunk_output_type": "ES_MODULES",
    "module_resolution": "NODE",
    "dependency_mode": "PRUNE",
    "entry_point": /** @type {string} */(params["entry"]),
  };
  if (params["define"])
    options["define"] = /** @type {(string[]|boolean|string)} */(params["define"]);

  const closureCompiler = new ClosureCompiler(options);
  closureCompiler.spawnOptions = {
    "cwd": isolateDir
  };
  console.info("kdjs isolate:", isolateDir);
  return new Promise((resolve, reject) => {
    closureCompiler.run((exitCode, output, errors) => {
      if (exitCode || errors) {
        reject(errors);
        return;
      }
      output = postprocess(output, unlinkedImports);
      if (params["printGccOutput"])
        console.log("GCC output\n", output);
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
        ecma: 2022,
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
    if (params["print"])
      console.log("UglifyJS output:\n", uglifiedCode, "\nSWC output:\n", swcOutput.code);
    if (params["output"])
      return write(/** @type {string} */(params["output"]), code)
        .then(() => code)
    return code;
  })
}

export { compile };

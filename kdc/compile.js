import ClosureCompiler from "google-closure-compiler";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import UglifyJS from "uglify-js";
import { combine, getDir } from "../util/paths";
import { darboğaz as bottleneck } from "../util/promises";
import { PACKAGE_EXTERNS, translateToLocal } from "./packageExterns";
import { postprocess } from "./postprocess";
import { preprocessAndIsolate } from "./preprocess";

/**
 * @param {!Array<string>} inputs
 * @param {string} isolateDir
 * @return {!Promise<void>}
 */
const copyToDir = (inputs, isolateDir) => Promise.all(
  inputs.map((input) => {
    const outFile = combine(isolateDir, input);
    if (input.startsWith(PACKAGE_EXTERNS))
      input = translateToLocal(input);
    return mkdir(getDir(outFile), { recursive: true })
      .then(() => copyFile(input, outFile));
  })
);

/** @typedef {!CliArgs} */
const Params = {};

// Never run more than 8 instances of GCC in parallel.
const Bottleneck = bottleneck(8);

/**
 * @param {!Params} params
 * @return {!Promise<void>}
 */
const compile = async (params) => {
  /** @const {string} */
  const isolateDir = combine(getDir(params["output"]), params["isolateDir"] || ".kdc_isolate");
  /** @const {!Set<string>} */
  const splitSet = new Set(params["split"] || []);
  /** @const {!Set<string>} */
  const externsSet = new Set(params["externs"] || []);
  /** @const {!Map<string, ImportDeclarations>} */
  const {
    missingImports,
    allFiles
  } = await preprocessAndIsolate(params["entry"], isolateDir, splitSet, externsSet);

  await copyToDir(Array.from(externsSet), isolateDir);

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

  const options = {
    js: Array.from(allFiles),
    compilation_level: "ADVANCED",
    charset: "utf-8",
    warning_level: "verbose",

    emit_use_strict: false,
    rewrite_polyfills: false,
    assume_function_wrapper: true,
    jscomp_error: jsCompErrors,
    jscomp_warning: jsCompWarnings,
    language_in: "ECMASCRIPT_NEXT",
    module_resolution: "NODE",
    dependency_mode: "PRUNE",
    entry_point: params["entry"],
  };
  if (externsSet.size)
    options.externs = Array.from(externsSet);
  if (params["define"])
    options.define = params["define"];

  const closureCompiler = new ClosureCompiler.compiler(options);
  closureCompiler.spawnOptions = {
    "cwd": isolateDir
  };

  return Bottleneck(() => new Promise((resolve, reject) => {
    closureCompiler.run((exitCode, output, errors) => {
      if (exitCode || errors) {
        reject(errors);
        return;
      }
      if (params["printGccOutput"])
        console.log("GCC output:", output);
      output = postprocess(output, missingImports);
      const uglified = UglifyJS.minify(output, {
        mangle: {
          toplevel: true,
        },
        toplevel: true,
        compress: {
          module: true,
          toplevel: true,
          passes: 3,
          unsafe: true,
          drop_console: params["nologs"],
        },
        warnings: "verbose",
      });
      console.log(`Uglified size:\t${uglified.code.length}\nGCC size:\t${output.length}`);
      const code = uglified.code.length < output.length ? uglified.code : output;
      console.log(uglified.warnings, uglified.error);
      return writeFile(params["output"], code).then(() => resolve(params["output"]))
    });
  }))
}

export { compile };

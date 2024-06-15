import ClosureCompiler from "google-closure-compiler";
import UglifyJS from "uglify-js";
import { bigintPass } from "./bigintPass";
import { copyToIsolate } from "./isolate";

/**
 * @param {string} fileName
 * @return {string} directory of the fileName
 */
const getDir = (fileName) => fileName.slice(0, fileName.lastIndexOf("/"));

/** @typedef {!CliArgs} */
const Params = {};

/**
 * @param {!Params} params
 * @return {!Promise<void>}
 */
const compile = async (params) => {
  /** @const {string} */
  const isolateDir = getDir(params["output"]) + "/isolate/";
  /** @const {!Map<string, !Array<string>>} */
  const importMap = new Map();

  const preprocessFn = (code, isEntryPoint) => isEntryPoint
    ? code.replace("export default", "globalThis['ExportDefault']=")
    : code;

  const postprocessFn = (code) => bigintPass(
    code.replace("globalThis.ExportDefault=", "export default"));

  await copyToIsolate(params["inputs"], isolateDir, preprocessFn);

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
    js: params["inputs"],
    compilation_level: "ADVANCED",
    charset: "utf-8",
    warning_level: "verbose",

    emit_use_strict: true,
    rewrite_polyfills: false,
    assume_function_wrapper: true,
    jscomp_error: jsCompErrors,
    jscomp_warning: jsCompWarnings,
    language_in: "ECMASCRIPT_NEXT",
    module_resolution: "NODE",
    dependency_mode: "PRUNE",
    entry_point: params["inputs"][0],
  };
  if (params["define"])
    options.define = params["define"];

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
      const uglified = UglifyJS.minify(output, {
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
      const code = postprocessFn(uglified.code);
      console.log("Size:", code.length);
      console.log(uglified.warnings, uglified.error);
      return Bun.write(params["output"], code)
        .then(() => resolve(params["output"]))
    });
  })
}

export { compile };

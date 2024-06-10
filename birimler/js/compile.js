import ClosureCompiler from "google-closure-compiler";
import UglifyJS from "uglify-js";
import { bigintPass } from "./bigintPass";
import { copyToIsolate } from "./isolate";
import { Params } from "./params";

/**
 * @param {!Params} params
 * @return {!Promise<void>}
 */
const compile = async (params) => {
  /** @const {string} */
  const isolateDir = params["isolateDir"];
  /** @const {string} */
  const inverseIsolateDir = "../".repeat(isolateDir.match(/\//g).length);
  /** @const {!Map<string, !Array<string>>} */
  const importMap = new Map();

  const preprocessFn = (code, isEntryPoint) => isEntryPoint
    ? code.replace("export default", "globalThis['ExportDefault']=")
    : code;

  const postprocessFn = (code) => bigintPass(
    code.replace("globalThis.ExportDefault=", "export default"));

  await copyToIsolate(params, preprocessFn);

  process.chdir(isolateDir);

  /** @const {!Array<string>} */
  const jsCompErrors = [
    "checkTypes",
    "strictCheckTypes",
    "unusedLocalVariables",
    "missingProperties"
  ];
  if (params["strict"])
    jsCompErrors.push("reportUnknownTypes");

  const closureCompiler = new ClosureCompiler.compiler({
    js: params["inputs"],
    compilation_level: "ADVANCED",
    charset: "utf-8",
    warning_level: "verbose",

    emit_use_strict: true,
    rewrite_polyfills: false,
    assume_function_wrapper: true,
    jscomp_error: jsCompErrors,
    language_in: "ECMASCRIPT_NEXT",
    module_resolution: "NODE",
    dependency_mode: "PRUNE",
    entry_point: params["inputs"][0],
  });

  closureCompiler.run(async (exitCode, output, errors) => {
    console.log("Returned", exitCode, errors);
    const uglified = UglifyJS.minify(output, {
      toplevel: true,
      compress: {
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
    await Bun.write(
      inverseIsolateDir + params["output"],
      code
    );
    process.chdir(inverseIsolateDir);
  });
}

export { compile };

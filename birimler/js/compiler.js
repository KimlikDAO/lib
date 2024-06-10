import ClosureCompiler from "google-closure-compiler";
import UglifyJS from "uglify-js";
import { Params, argsToParams } from "./argsParser";
import { bigintPass } from "./bigintPass";

/**
 * @param {string} fileName
 * @return {string} directory of the fileName
 */
const getDir = (fileName) => fileName.slice(0, fileName.lastIndexOf("/"));

/**
 * @param {!Array<string>} files
 * @param {string} prefix
 * @return {!Promise<void>}
 */
const copyToIsolate = async (files, prefix) => Promise.all(
  files.map((file) => Bun.write(prefix + file, Bun.file(file))));

const preprocessExports = (code) => code.replace("export default", "globalThis['ExportDefault']=");

const postprocessExports = (code) => code.replace("globalThis.ExportDefault=", "export default");

/**
 * @const
 * @type {!Params}
 */
const params = argsToParams(process.argv.slice(2));

/** @const {string} */
const outputFile = params["output"];
/** @const {string} */
const outputDir = getDir(outputFile);
/** @const {string} */
const isolateDir = outputDir + "/input/";
/** @const {string} */
const entryFile = params["inputs"][0];

await copyToIsolate(params["inputs"].slice(1), isolateDir);
await Bun.write(
  isolateDir + entryFile,
  preprocessExports(await Bun.file(entryFile).text())
);
process.chdir(isolateDir);

const JsCompErrors = [
  "checkTypes",
  "strictCheckTypes",
  "unusedLocalVariables",
  "missingProperties"
];
if (params["strict"])
  JsCompErrors.push("reportUnknownTypes");

const cc = new ClosureCompiler.compiler({
  js: params["inputs"],
  compilation_level: "ADVANCED",
  charset: "utf-8",
  warning_level: "verbose",

  emit_use_strict: true,
  rewrite_polyfills: false,
  assume_function_wrapper: true,
  jscomp_error: JsCompErrors,
  language_in: "ECMASCRIPT_NEXT",
  module_resolution: "NODE",
  dependency_mode: "PRUNE",
  entry_point: entryFile,
});

cc.run(async (exitCode, output, errors) => {
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
  const code = bigintPass(postprocessExports(uglified.code));
  console.log("Size:", code.length);
  console.log(uglified.warnings, uglified.error);
  await Bun.write(
    "../".repeat(isolateDir.match(/\//g).length) + outputFile,
    code
  );
});

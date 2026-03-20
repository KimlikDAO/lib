import * as swc from "@swc/core";
import { build, write } from "bun";
import { compiler as ClosureCompiler, CompileOptions } from "google-closure-compiler";
import UglifyJS, { CompressOptions, MinifyOptions } from "uglify-js";
import { CliArgs } from "../util/cli";
import { postprocess } from "./postprocess";
import { preprocessAndIsolate, TranspileFn } from "./preprocess";
import { kdtsPlugin } from "./util/plugin";

const UglifyOptions: MinifyOptions = {
  mangle: { toplevel: true },
  toplevel: true,
  compress: {
    module: true,
    toplevel: true,
    passes: 10,
    unsafe: true,
    drop_console: false, // overridden per call from params["nologs"]
  },
  warnings: "verbose",
};

const SwcMinifyOptions = {
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
  },
};

/**
 * Shared pipeline: UglifyJS -> tweakPasses -> SWC minify -> pick smaller ->
 * print, write. Used for both GCC and Bun build output.
 */
const finishCompile = async (
  code: string,
  args: CliArgs,
  inputLabel: string
): Promise<string> => {
  console.log(`${inputLabel} size:\t${code.length}`);
  if (args.isTrue("nologs"))
    (UglifyOptions.compress as CompressOptions).drop_console = true;
  const uglified = UglifyJS.minify(code, UglifyOptions);
  if (uglified.error)
    throw uglified.error;
  console.log(uglified.warnings, uglified.error);
  const uglifiedCode = uglified.code;
  const swcOutput = await swc.minify(uglifiedCode, SwcMinifyOptions);
  let result = uglifiedCode.length < swcOutput.code.length
    ? uglifiedCode : swcOutput.code;

  console.log(`Uglified size:\t${uglifiedCode.length}`);
  console.log(`SWC size:     \t${swcOutput.code.length}`);
  if (args.isTrue("print"))
    console.log("UglifyJS output:\n", uglifiedCode, "\nSWC output:\n", swcOutput.code);
  const output = args.asStringOr("output", "");
  if (output)
    await write(output, result);
  return result;
};

const compileWithBun = async (args: CliArgs) => {
  const result = await build({
    entrypoints: [args.asStringOr("entry", "")],
    format: "esm",
    target: "bun",
    packages: "external",
    minify: true,
    plugins: [kdtsPlugin],
  });
  if (!result.success) {
    const messages = result.logs.map((l) => l.message).join("\n");
    throw `Bun build failed: ${messages}`;
  }
  const text = await result.outputs[0].text();
  return finishCompile(text, args, "bun build");
};

type CompileParams = Record<string, boolean | string | string[]> | CliArgs;

/**
 * Resolves to the compiled code or void if it determines that the code
 * is up to date.
 * On error, rejects with the error.
 */
const compile = async (
  params: CompileParams,
  checkFreshFn?: (deps: string[]) => Promise<boolean>,
  transpileFn?: TranspileFn
): Promise<void | string> => {
  if (!(params instanceof CliArgs))
    params = new CliArgs(params);

  if (params.isTrue("fast"))
    return compileWithBun(params);

  const {
    unlinkedImports,
    allFiles,
    isolateDir,
    ignoreUnusedLocals
  } = await preprocessAndIsolate(params, transpileFn);
  const allFilesArray: string[] = Array.from(allFiles).sort();
  if (checkFreshFn && await checkFreshFn(allFilesArray.map(f => "/" + f)))
    return;

  const jsCompErrors = [
    "unusedLocalVariables",
    "checkTypes",
    "missingProperties",
    "strictCheckTypes",
  ];
  const jsCompWarnings: string[] = [];
  if (params.isTrue("strict"))
    jsCompWarnings.push("reportUnknownTypes");
  if (params.isTrue("loose"))
    jsCompErrors.pop();
  if (ignoreUnusedLocals)
    jsCompErrors.shift();

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
    "entry_point": params.asStringOr("entry", ""),
  };

  const closureCompiler = new ClosureCompiler(options as CompileOptions);
  closureCompiler.spawnOptions = {
    "cwd": isolateDir
  };
  console.info("kdts isolate:", isolateDir);
  return new Promise((resolve, reject) => {
    closureCompiler.run((exitCode, output, errors) => {
      if (exitCode || errors) {
        reject(errors);
        return;
      }
      output = postprocess(output, unlinkedImports);
      if (params.isTrue("printGccOutput"))
        console.log("GCC output\n", output);
      finishCompile(output, params, "GCC").then(resolve, reject);
    });
  });
}

export { compile };

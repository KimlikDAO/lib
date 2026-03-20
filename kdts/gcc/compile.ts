import { compiler as ClosureCompiler, CompileOptions } from "google-closure-compiler";
import { CliArgs } from "../../util/cli";
import { postprocess } from "./postprocess";
import { preprocessAndIsolate, TranspileFn } from "./preprocess";

/**
 * Resolves to the compiled code or void if it determines that the code
 * is up to date.
 * On error, rejects with the error.
 */
const compile = async (
  args: CliArgs,
  checkFreshFn?: (deps: string[]) => Promise<boolean>,
  transpileFn?: TranspileFn
): Promise<string | void> => {
  const {
    unlinkedImports,
    allFiles,
    isolateDir,
    ignoreUnusedLocals
  } = await preprocessAndIsolate(args, transpileFn);
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
  if (args.isTrue("strict"))
    jsCompWarnings.push("reportUnknownTypes");
  if (args.isTrue("loose"))
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
    "entry_point": args.asStringOr("entry", ""),
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
      if (args.isTrue("printGccOutput"))
        console.log("GCC output\n", output);
      console.log(`GCC size:\t${output.length}`);
      resolve(output);
    });
  });
}

export { compile };

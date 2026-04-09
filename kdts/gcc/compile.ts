import { CliArgs } from "../../util/cli";
import { compileWithClosureCompiler } from "./closureCompiler";
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
  if (checkFreshFn && await checkFreshFn(allFiles.map(f => "/" + f)))
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

  let output = await compileWithClosureCompiler({
    allFiles,
    entryPoint: args.asStringOr("entry", ""),
    isolateDir,
    jsCompErrors,
    jsCompWarnings,
  });
  output = postprocess(output, unlinkedImports);
  if (args.isTrue("printGccOutput")) {
    console.log("GCC output");
    console.log(output);
  }
  console.log(`GCC size:       ${output.length}`);
  return output;
}

export { compile };

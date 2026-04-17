import { CliArgs } from "../../util/cli";
import { compileWithClosureCompiler } from "./closureCompiler";
import { postprocess } from "./postprocess";
import { prepareGccProgram, TranspileFn } from "./program";

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
  const program = await prepareGccProgram(args, transpileFn);
  if (checkFreshFn && await checkFreshFn(program.sourceSet.getPaths().map((f) => "/" + f)))
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

  let output = await compileWithClosureCompiler(program, {
    jsCompErrors,
    jsCompWarnings,
  });
  output = postprocess(output, program.unlinkedImports);
  console.log(`GCC size:       ${output.length}`);
  return output;
}

export { compile };

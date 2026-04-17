import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { compileWithClosureCompiler } from "./closureCompiler";
import { postprocess } from "./postprocess";
import { GccProgram } from "./program";

interface TranspileFn {
  (content: string, file: string, isEntry?: boolean): string | null;
}

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
  const entry = args.asStringOr("entry", "");
  const isolateDir = combine(
    getDir(args.asStringOr("output", "build/" + entry)),
    args.asStringOr("isolateDir", ".kdts_isolate")
  );
  const program = await GccProgram.from(entry, args.asRecord("overrides"), args.asList("externs"));
  if (checkFreshFn && await checkFreshFn(Object.keys(program.sources).sort().map((f) => "/" + f)))
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
    isolateDir,
    jsCompErrors,
    jsCompWarnings,
  });
  output = postprocess(output, program.imports);
  console.log(`GCC size:       ${output.length}`);
  return output;
}

export { compile };

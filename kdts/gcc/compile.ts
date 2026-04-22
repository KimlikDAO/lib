import { build, write } from "bun";
import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { compileWithClosureCompiler } from "./closureCompiler";
import { GccProgram } from "./gccProgram";
import { postprocess } from "./postprocess";

type TranspileFn = (content: string, file: string, isEntry?: boolean) =>
  string | null;

const bundle = async (
  code: string,
  isolateDir: string,
  external: string[]
): Promise<string> => {
  const entry = combine(isolateDir, "__kdts_bundle_entry__.js");
  await write(entry, code);
  const result = await build({
    entrypoints: [entry],
    format: "esm",
    target: "bun",
    packages: "bundle",
    external,
    minify: true,
  });
  if (!result.success) {
    const messages = result.logs.map((l) => l.message).join("\n");
    throw `Bun build failed: ${messages}`;
  }
  const text = await result.outputs[0].text();
  console.log(`Bun bundle size:${text.length}`);
  return text;
}

/**
 * Resolves to the compiled code or void if it determines that the code
 * is up to date.
 * On error, rejects with the error.
 */
const compile = async (
  args: CliArgs,
  checkFreshFn?: (deps: string[]) => Promise<boolean>,
  _transpileFn?: TranspileFn
): Promise<string | void> => {
  const entry = args.asStringOr("entry", "");
  const isolateDir = combine(
    getDir(args.asStringOr("output", "build/" + entry)),
    args.asStringOr("isolateDir", ".kdts_isolate")
  );
  const program = await GccProgram.from(
    entry,
    args.asRecord("overrides"),
    args.asList("externs"),
    isolateDir
  );
  if (checkFreshFn && await checkFreshFn(program.sources))
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
  if (program.flowTransformed)
    jsCompErrors.shift();

  let output = await compileWithClosureCompiler(program, {
    jsCompErrors,
    jsCompWarnings,
  });
  output = postprocess(output, program);
  console.log(`GCC size:       ${output.length}`);
  if (args.asStringOr("packages", "external") == "bundle")
    output = await bundle(output, isolateDir, args.asList("external"));
  return output;
}

export { compile };

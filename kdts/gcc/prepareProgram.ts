import { file } from "bun";
import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { resolveRootPath } from "../frontend/resolver";
import { SourceSet } from "../model/sourceSet";
import { transpileJs } from "./gccFromKdjs";
import { createGccProgram, GccProgram } from "./program";
import { transpileDts, transpileTs } from "./transpile";

type TranspileFn = (content: string, file: string, isEntry?: boolean) =>
  string | null;

const prepareGccProgram = async (
  args: CliArgs,
  _transpileFn?: TranspileFn
): Promise<GccProgram> => {
  const entryArg = args.asStringOr("entry", "");
  const isolateDir = combine(
    getDir(args.asStringOr("output", "build/" + entryArg)),
    args.asStringOr("isolateDir", ".kdts_isolate")
  );
  const entry = resolveRootPath(entryArg);
  const sourceSet = new SourceSet(entry, isolateDir);
  const program = createGccProgram(sourceSet, args.asRecord("overrides"));
  const writePromises: Promise<number>[] = [];

  sourceSet.add(entry);
  for (const extern of args.asList("externs"))
    sourceSet.add(resolveRootPath(extern));

  for (let source; source = sourceSet.pop();) {
    let content = await file(source.path).text();

    if (source.path.endsWith(".d.ts"))
      content = transpileDts(source, content, program);
    else if (source.path.endsWith(".ts"))
      content = transpileTs(source, content, program);
    else if (source.path.endsWith(".js"))
      content = transpileJs(source, content, program);
    else throw "Provide transpile function";

    writePromises.push(sourceSet.writeIsolated(source, content));
  }
  await Promise.all(writePromises);
  return program;
};

export { prepareGccProgram, TranspileFn };

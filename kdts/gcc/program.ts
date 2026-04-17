import { file } from "bun";
import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { resolveRootPath } from "../frontend/resolver";
import { ModuleImports } from "../model/moduleImports";
import { SourceSet } from "../model/sourceSet";
import { transpileJs } from "./gccFromKdjs";
import { transpileDts, transpileTs } from "./transpile";

interface GccProgram {
  sourceSet: SourceSet;
  overrides: Record<string, unknown>;
  unlinkedImports: ModuleImports;
}

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
  const overrides = args.asRecord("overrides");
  const unlinkedImports = new ModuleImports();
  const writePromises: Promise<number>[] = [];

  sourceSet.add(entry);
  for (const extern of args.asList("externs"))
    sourceSet.add(resolveRootPath(extern));

  for (let source; source = sourceSet.pop();) {
    let content = await file(source.path).text();

    if (source.path.endsWith(".d.ts"))
      content = transpileDts(source, content, sourceSet);
    else if (source.path.endsWith(".ts"))
      content = transpileTs(source, content, sourceSet, overrides, unlinkedImports);
    else if (source.path.endsWith(".js"))
      content = transpileJs(source, content, sourceSet, overrides, unlinkedImports);
    else throw "Provide transpile function";

    writePromises.push(sourceSet.writeIsolated(source, content));
  }
  await Promise.all(writePromises);
  return {
    sourceSet,
    overrides,
    unlinkedImports,
  };
};

export { GccProgram, TranspileFn, prepareGccProgram };

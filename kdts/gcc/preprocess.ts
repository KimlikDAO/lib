import { file, write } from "bun";
import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { resolveRootPath } from "../frontend/resolver";
import { SourceSet } from "../model/sourceSet";
import { ModuleImports } from "../model/moduleImports";
import { transpileJs } from "./gccFromKdjs";
import { transpileDts, transpileTs } from "./transpile";

interface PreprocessResult {
  unlinkedImports: ModuleImports,
  allFiles: string[],
  isolateDir: string,
  ignoreUnusedLocals: boolean;
};

type TranspileFn = (content: string, file: string, isEntry?: boolean) =>
  string | null;

const preprocessAndIsolate = async (
  args: CliArgs,
  _transpileFn?: TranspileFn
): Promise<PreprocessResult> => {
  const entry = args.asStringOr("entry", "");
  const isolateDir = combine(
    getDir(args.asStringOr("output", "build/" + entry)),
    args.asStringOr("isolateDir", ".kdts_isolate")
  );
  const overrides = args.asRecord("overrides");
  const sources = new SourceSet();

  sources.add(resolveRootPath(entry));
  for (const extern of args.asList("externs"))
    sources.add(resolveRootPath(extern));
  const unlinkedImports = new ModuleImports();
  const writePromises: Promise<number>[] = [];
  let ignoreUnusedLocals = false;

  for (let source; source = sources.pop();) {
    let content = await file(source.path).text();

    if (source.path.endsWith(".d.ts"))
      content = transpileDts(source, content, sources);
    else if (source.path.endsWith(".ts"))
      content = transpileTs(source, content, sources, overrides, unlinkedImports);
    else if (source.path.endsWith(".js"))
      content = transpileJs(source, content, sources, overrides, unlinkedImports);
    else throw "Provide transpile function";

    const outFile = combine(isolateDir, source.path);
    writePromises.push(write(outFile, content));
  }
  await Promise.all(writePromises);
  return {
    unlinkedImports,
    allFiles: sources.getPaths(),
    isolateDir,
    ignoreUnusedLocals,
  };
};

export { preprocessAndIsolate, TranspileFn };

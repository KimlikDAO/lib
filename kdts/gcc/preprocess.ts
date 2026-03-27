import { file, write } from "bun";
import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { resolveRootPath } from "../frontend/resolver";
import { SourceSet } from "../frontend/sourceSet";
import { ModuleImports } from "../model/moduleImport";
import { transpileTs } from "../transpiler/kdjsFromTs";
import { transpileDts } from "./externFromDts";
import { transpileKdjs } from "./gccFromKdjs";

const DECL_FILE = /\.(d|e)\.(js|ts)$/;

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
  const globals = args.asRecord("globals");
  const sources = new SourceSet();
  
  sources.add(resolveRootPath(entry));
  for (const extern of args.asList("externs"))
    sources.add(resolveRootPath(extern));
  const unlinkedImports = new ModuleImports();
  const writePromises: Promise<number>[] = [];
  let ignoreUnusedLocals = false;

  for (let source; source = sources.pop();) {
    let content = await file(source.path).text();

    if (source.path.endsWith(".ts") && !source.path.endsWith(".d.ts"))
      content = transpileTs(content);

    content = DECL_FILE.test(source.path)
      ? transpileDts(source, content, sources)
      : transpileKdjs(source, content, sources, globals, unlinkedImports);

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

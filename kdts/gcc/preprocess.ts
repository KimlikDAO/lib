import { file, write } from "bun";
import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { transpileTs } from "../transpiler/kdjsFromTs";
import { ImportStatement } from "../util/modules";
import { transpileDts } from "./externFromDts";
import { transpileJs } from "./gccFromKdjs";

interface PreprocessResult {
  unlinkedImports: Map<string, ImportStatement>;
  allFiles: Set<string>;
  isolateDir: string;
  ignoreUnusedLocals: boolean;
};

type TranspileFn = (content: string, file: string, isEntry?: boolean) =>
  string | null;

const preprocessAndIsolate = async (
  args: CliArgs,
  transpileFn?: TranspileFn
): Promise<PreprocessResult> => {
  const entry = args.asStringOr("entry", "");
  const isolateDir = combine(
    getDir(args.asStringOr("output", "build/" + entry)),
    args.asStringOr("isolateDir", ".kdts_isolate")
  );
  const globals = args.asRecord("globals");
  const externs = args.asList("externs");
  const files = [entry, ...externs];

  const unlinkedImports = new Map<string, ImportStatement>();
  const allFiles = new Set<string>();
  const writePromises: Promise<number>[] = [];
  let ignoreUnusedLocals = false;

  for (let f; f = files.pop();) {
    if (allFiles.has(f)) continue;
    allFiles.add(f);
    let content = await file(f).text();
    if (f.endsWith(".d.ts") || f.endsWith(".e.ts"))
      content = transpileDts(content, f);
    else if (f.endsWith(".ts"))
      content = transpileTs(content);
    else if (!f.endsWith(".js")) {
      if (!transpileFn)
        throw "For non-js files please provide a transpile function: " + f;
      const transpiled = transpileFn(content, f, f == entry);
      content = transpiled || content;
      ignoreUnusedLocals ||= !!transpiled;
    }
    content = transpileJs(f == entry, f, content, files, globals, unlinkedImports);

    const outFile = combine(isolateDir, f);
    writePromises.push(write(outFile, content));
  }
  await Promise.all(writePromises);
  return {
    unlinkedImports,
    allFiles,
    isolateDir,
    ignoreUnusedLocals,
  };
};

export { preprocessAndIsolate, PreprocessResult, TranspileFn };

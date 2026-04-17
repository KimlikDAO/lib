import { file, write } from "bun";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { ModuleExports } from "../model/moduleExports";
import { ModuleImports } from "../model/moduleImports";
import { SourceSet } from "../model/sourceSet";
import { DiskProgram } from "../model/program";
import { resolveRootPath } from "../frontend/resolver";
import { transpileJs } from "./gccFromKdjs";
import { transpileDts, transpileTs } from "./transpile";

class GccProgram implements DiskProgram {
  flowTransformed = false;

  constructor(
    readonly entry: string,
    readonly isolateDir: string,
    readonly sources: string[] = [],
    readonly imports = new ModuleImports(),
    readonly exports = new ModuleExports()
  ) { }

  private writeSource(
    path: string,
    content: string,
    writes: Promise<number>[]
  ) {
    const outFile = join(this.isolateDir, path);
    mkdirSync(dirname(outFile), { recursive: true });
    writes.push(write(outFile, content));
    this.sources.push(path);
  }

  static async from(
    entry: string,
    overrides: Record<string, unknown> = {},
    externs: string[] = [],
    isolateDir = ".kdts_isolate"
  ): Promise<GccProgram> {
    const sourceSet = new SourceSet();
    const program = new GccProgram(entry, isolateDir);
    const writes: Promise<number>[] = [];

    sourceSet.add(resolveRootPath(entry));
    for (const extern of externs)
      sourceSet.add(resolveRootPath(extern));

    for (let source; source = sourceSet.pop();) {
      let content = await file(source.path).text();

      if (source.path.endsWith(".d.ts"))
        content = transpileDts(source, content, sourceSet);
      else if (source.path.endsWith(".ts"))
        content = transpileTs(source, content, sourceSet, overrides, program.imports);
      else if (source.path.endsWith(".js"))
        content = transpileJs(source, content, sourceSet, program.imports);
      else throw "Provide transpile function";

      program.writeSource(source.path, content, writes);
    }
    await Promise.all(writes);
    program.sources.sort();
    return program;
  }
}

export { GccProgram };

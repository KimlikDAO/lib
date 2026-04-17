import { file } from "bun";
import { ModuleExports } from "../model/moduleExports";
import { ModuleImports } from "../model/moduleImports";
import { SourceSet } from "../model/sourceSet";
import { SourceProgram } from "../model/sourceProgram";
import { resolveRootPath } from "../frontend/resolver";
import { transpileJs } from "./gccFromKdjs";
import { transpileDts, transpileTs } from "./transpile";

class GccProgram implements SourceProgram {
  constructor(
    readonly entry: string,
    readonly sources: Record<string, string> = {},
    readonly imports = new ModuleImports(),
    readonly exports = new ModuleExports()
  ) { }

  static async from(
    entry: string,
    overrides: Record<string, unknown> = {},
    externs: string[] = []
  ): Promise<GccProgram> {
    const sourceSet = new SourceSet();
    const program = new GccProgram(entry);

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

      program.sources[source.path] = content;
    }
    return program;
  }
}

export { GccProgram };

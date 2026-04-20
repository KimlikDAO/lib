import { file, Transpiler } from "bun";
import { basename } from "node:path";
import { replaceExt } from "../../util/paths";
import { resolveRootPath } from "../frontend/resolver";
import { moduleAtPath } from "../frontend/sourcePath";
import { SourceSet } from "../frontend/sourceSet";
import { ModuleExports } from "../model/moduleExports";
import { ModuleImports } from "../model/moduleImports";
import { DiskProgram } from "../model/program";
import { Source } from "../model/source";
import {
  KdtsExportExtern,
  KdtsExportName,
  toMarkerBinding
} from "./exportMarker";
import { transpileDts, transpileTs } from "./transpile";
import { transpileJs } from "./transpileJs";

const SourceScanner = new Transpiler({ loader: "ts" });

const entryImportPath = (path: string): string =>
  "./" + basename(path);

const makeEntrySource = (entryPath: string, exports: string[]): string => {
  const namedExports = exports.filter((name) => name != "default");
  const lines: string[] = [];
  const calls: string[] = [];
  const usedBindings = new Set<string>();

  if (exports.includes("default")) {
    lines.push("import kdts_export_default");
    if (namedExports.length)
      lines[0] += ", ";
    usedBindings.add("kdts_export_default");
    calls.push(`${KdtsExportName}("default", kdts_export_default);`);
  } else if (namedExports.length)
    lines.push("import ");

  if (namedExports.length) {
    const bindings = namedExports.map((name) => ({
      name,
      binding: toMarkerBinding("kdts_export_", name, usedBindings)
    }));
    const imports = bindings
      .map(({ name, binding }) => `${name} as ${binding}`)
      .join(", ");
    lines[0] += `{ ${imports} }`;
    for (const { name, binding } of bindings)
      calls.push(`${KdtsExportName}(${JSON.stringify(name)}, ${binding});`);
  }

  lines[0] += ` from ${JSON.stringify(entryImportPath(entryPath))};`;
  lines.push("");
  lines.push(...calls);
  lines.push("");
  return lines.join("\n");
}

const initializeEntry = async (
  sourceSet: SourceSet,
  entry: Source
): Promise<{ entry: Source, exports: ModuleExports }> => {
  sourceSet.add(entry);
  const { exports: names } = SourceScanner.scan(await file(entry.path).text());
  const exports = new ModuleExports(names);
  if (!names.length)
    return { entry, exports };

  const entrySource = moduleAtPath(replaceExt(entry.path, ".entry.ts"));
  const entryExtern = moduleAtPath(replaceExt(entrySource.path, ".d.ts"));
  await sourceSet.materialize(entrySource, makeEntrySource(entry.path, names));
  await sourceSet.materialize(entryExtern, KdtsExportExtern);
  return { entry: entrySource, exports };
}

class GccProgram implements DiskProgram {
  flowTransformed = false;

  constructor(
    readonly entry: string,
    readonly isolateDir: string,
    readonly sources: string[] = [],
    readonly imports: ModuleImports,
    readonly exports: ModuleExports,
  ) { }

  static async from(
    entryPath: string,
    overrides: Record<string, unknown> = {},
    externs: string[] = [],
    isolateDir = ".kdts_isolate"
  ): Promise<GccProgram> {
    const sourceSet = new SourceSet(isolateDir);
    const resolvedEntry = resolveRootPath(entryPath);
    const { entry, exports } = await initializeEntry(sourceSet, resolvedEntry);
    const imports = new ModuleImports();

    for (const extern of externs)
      sourceSet.add(resolveRootPath(extern));

    for (let source; source = sourceSet.pop();) {
      let content = await sourceSet.read(source);

      if (source.path.endsWith(".d.ts"))
        content = transpileDts(source, content, sourceSet);
      else if (source.path.endsWith(".ts"))
        content = transpileTs(source, content, sourceSet, overrides, imports);
      else if (source.path.endsWith(".js"))
        content = transpileJs(source, content, sourceSet, overrides, imports);
      else throw "Provide transpile function";

      sourceSet.write(source.path, content);
    }
    await sourceSet.flushWrites();
    const sources = sourceSet.getPaths();
    return new GccProgram(entry.path, isolateDir, sources, imports, exports);
  }
}

export { GccProgram };

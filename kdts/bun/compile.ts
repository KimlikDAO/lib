import { build, Transpiler } from "bun";
import { readFileSync } from "node:fs";
import { CliArgs } from "../../util/cli";
import { combine, getDir } from "../../util/paths";
import { makeKdtsOverridablePlugin } from "../util/plugin";

const collectDeps = (entry: string): string[] => {
  const allFiles = new Set<string>();
  const files = [entry];
  allFiles.add(entry);
  const transpiler = new Transpiler({ loader: "ts" });

  for (let f; f = files.pop();) {
    const imports = transpiler.scanImports(readFileSync(f, "utf8"));

    for (let { path } of imports) {
      if (path.startsWith("."))
        path = combine(getDir(f), path);
      if (allFiles.has(path)) continue;
      allFiles.add(path);
      files.push(path);
    }
  }
  return Array.from(allFiles).sort();
};

const compile = async (
  args: CliArgs,
  checkFreshFn?: (deps: string[]) => Promise<boolean>,
): Promise<string | void> => {
  const entry = args.asStringOr("entry", "");
  const overrides = args.asRecord("overrides");
  if (checkFreshFn && await checkFreshFn(collectDeps(entry)))
    return;
  const result = await build({
    entrypoints: [entry],
    format: "esm",
    target: "bun",
    packages: "external",
    minify: true,
    plugins: Object.keys(overrides).length
      ? [makeKdtsOverridablePlugin(overrides)]
      : [],
  });
  if (!result.success) {
    const messages = result.logs.map((l) => l.message).join("\n");
    throw `Bun build failed: ${messages}`;
  }
  const text = await result.outputs[0].text();
  console.log(`Bun size:\t${text.length}`);
  return text;
};

export { compile };

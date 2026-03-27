import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { SourceSet } from "../../frontend/sourceSet";
import { ModuleImports } from "../../model/moduleImport";
import { transpileKdjs } from "../../gcc/gccFromKdjs";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

const createSource = (path: string): Parameters<typeof transpileKdjs>[0] => ({
  path,
  source: `module:${path.replace(/\.(js|ts)$/, "")}` as `module:${string}`,
});

const transpile = (content: string, path = "test.js"): string =>
  transpileKdjs(
    createSource(path),
    content,
    new SourceSet(),
    {},
    new ModuleImports()
  );

const transpileWithFiles = (
  content: string,
  path: string,
  files: Record<string, string> = {}
): { output: string, sources: SourceSet, unlinkedImports: ModuleImports } => {
  const cwd = mkdtempSync(join(tmpdir(), "kdts-gcc-"));
  process.chdir(cwd);

  for (const filePath in files) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, files[filePath]!);
  }

  const sources = new SourceSet();
  const unlinkedImports = new ModuleImports();
  return {
    output: transpileKdjs(
      createSource(path),
      content,
      sources,
      {},
      unlinkedImports
    ),
    sources,
    unlinkedImports
  };
};

test("rewrites jsdoc types for exported consts", () => {
  const input = `/** @const {Record<string, () => bigint>} */
export const BIG_SPITTER = { "1": () => 1n, "2": () => 2n };`;

  expect(transpile(input)).toBe(`/** @const {!Object<string,function(): bigint>} */
export const BIG_SPITTER = { "1": () => 1n, "2": () => 2n };`);
});

test("explicit declaration imports become alias consts without aborting later nodes", () => {
  const input = `import { Foo } from "./foo.d.ts";
import { Bar } from "./bar.d.ts";
const BAZ = Foo + Bar;`;

  const { output, sources } = transpileWithFiles(input, "main.js", {
    "foo.d.ts": "",
    "bar.d.ts": "",
  });

  expect(output).toBe(`; // gcc-js: declaration imports are replaced by type alias imports
; // gcc-js: declaration imports are replaced by type alias imports
/** @const */
const Foo = kdts$$module$foo_d$Foo;
/** @const */
const Bar = kdts$$module$bar_d$Bar;

const BAZ = Foo + Bar;`);
  expect(sources.getPaths()).toEqual(["bar.d.ts", "foo.d.ts"]);
});

test("package imports are collected for postprocess and replaced by alias consts", () => {
  const input = `import Foo, { baz, bar } from "pkg";
export const x = Foo + bar + baz;`;

  const { output, sources, unlinkedImports } = transpileWithFiles(input, "main.js", {
    "node_modules/@kimlikdao/kdts/@types/pkg.d.ts": "",
  });

  expect(output).toBe(`; // gcc-js: declaration imports are replaced by type alias imports
/** @const */
const Foo = kdts$$package$pkg$default;
/** @const */
const baz = kdts$$package$pkg$baz;
/** @const */
const bar = kdts$$package$pkg$bar;

export const x = Foo + bar + baz;`);
  expect(sources.getPaths()).toEqual(["node_modules/@kimlikdao/kdts/@types/pkg.d.ts"]);
  expect(unlinkedImports.groupBySource()).toEqual({
    "package:pkg": {
      default: "Foo",
      baz: "baz",
      bar: "bar",
    },
  });
});

test("leaves export syntax unchanged", () => {
  const input = `const Foo = 1;
export { Foo };
export default Foo;`;

  expect(transpile(input, "test.d.js")).toBe(input);
});

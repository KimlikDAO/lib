import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { combine } from "../../../util/paths";
import { SourceSet } from "../../frontend/sourceSet";
import { Source } from "../source";

const createSourceSet = (...resolvedSources: Source[]) => {
  const sources = new SourceSet();

  for (const resolvedSource of resolvedSources)
    sources.add(resolvedSource);

  return sources;
};

const moduleSource = (path: string): Source => ({
  path,
  id: `module:${path.replace(/\.(tsx|jsx|ts|mjs|js)$/, "")}`
});

test("dedupes by source id and keeps the first resolved path", () => {
  const sources = createSourceSet(
    { path: "lib/a.ts", id: "module:lib/a" },
    { path: "symlinked/a.ts", id: "module:lib/a" },
    { path: "node_modules/@kimlikdao/kdts/@types/bun/index.d.ts", id: "package:bun" },
  );

  expect(sources.getPaths()).toEqual([
    "lib/a.ts",
    "node_modules/@kimlikdao/kdts/@types/bun/index.d.ts",
  ]);
});

test("pop returns pending sources in reverse insertion order", () => {
  const sources = createSourceSet(
    { path: "lib/a.ts", id: "module:lib/a" },
    { path: "lib/b.ts", id: "module:lib/b" },
  );

  expect(sources.pop()).toEqual({ path: "lib/b.ts", id: "module:lib/b" });
  expect(sources.pop()).toEqual({ path: "lib/a.ts", id: "module:lib/a" });
  expect(sources.pop()).toBeUndefined();
});

test("getPaths retains resolved paths after pending sources are popped", () => {
  const sources = createSourceSet(
    { path: "lib/a.ts", id: "module:lib/a" },
  );

  expect(sources.pop()).toEqual({ path: "lib/a.ts", id: "module:lib/a" });
  expect(sources.getPaths()).toEqual(["lib/a.ts"]);
});

test("getPaths returns all resolved paths in sorted order", () => {
  const sources = createSourceSet(
    { path: "z.ts", id: "module:z" },
    { path: "a.ts", id: "module:a" },
    { path: "pkg/b.d.ts", id: "package:b" },
  );

  expect(sources.getPaths()).toEqual(["a.ts", "pkg/b.d.ts", "z.ts"]);
});

test("materialize tracks sources and writes them to the isolate", async () => {
  mkdirSync("tmp", { recursive: true });
  const dir = mkdtempSync("tmp/source-set-");
  const isolateDir = combine(dir, ".kdts_isolate");
  const sourcePath = combine(dir, "entry.ts");

  try {
    const sources = new SourceSet(isolateDir);
    const source = moduleSource(sourcePath);
    await sources.materialize(source, "console.log(1);\n");

    expect(sources.getPaths()).toEqual([sourcePath]);
    expect(existsSync(combine(isolateDir, sourcePath))).toBe(true);
    expect(readFileSync(combine(isolateDir, sourcePath), "utf8")).toBe("console.log(1);\n");
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

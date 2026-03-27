import { expect, test } from "bun:test";
import { SourceSet } from "../sourceSet";

type ResolvedSource = Parameters<SourceSet["add"]>[0];

const createSourceSet = (...resolvedSources: ResolvedSource[]) => {
  const sources = new SourceSet();

  for (const resolvedSource of resolvedSources)
    sources.add(resolvedSource);

  return sources;
};

test("dedupes by source id and keeps the first resolved path", () => {
  const sources = createSourceSet(
    { path: "lib/a.ts", source: "module:lib/a" },
    { path: "symlinked/a.ts", source: "module:lib/a" },
    { path: "node_modules/@kimlikdao/kdts/@types/bun.d.ts", source: "package:bun" },
  );

  expect(sources.getPaths()).toEqual([
    "lib/a.ts",
    "node_modules/@kimlikdao/kdts/@types/bun.d.ts",
  ]);
});

test("pop returns pending sources in reverse insertion order", () => {
  const sources = createSourceSet(
    { path: "lib/a.ts", source: "module:lib/a" },
    { path: "lib/b.ts", source: "module:lib/b" },
  );

  expect(sources.pop()).toEqual({ path: "lib/b.ts", source: "module:lib/b" });
  expect(sources.pop()).toEqual({ path: "lib/a.ts", source: "module:lib/a" });
  expect(sources.pop()).toBeUndefined();
});

test("getPaths retains resolved paths after pending sources are popped", () => {
  const sources = createSourceSet(
    { path: "lib/a.ts", source: "module:lib/a" },
  );

  expect(sources.pop()).toEqual({ path: "lib/a.ts", source: "module:lib/a" });
  expect(sources.getPaths()).toEqual(["lib/a.ts"]);
});

test("getPaths returns all resolved paths in sorted order", () => {
  const sources = createSourceSet(
    { path: "z.ts", source: "module:z" },
    { path: "a.ts", source: "module:a" },
    { path: "pkg/b.d.ts", source: "package:b" },
  );

  expect(sources.getPaths()).toEqual(["a.ts", "pkg/b.d.ts", "z.ts"]);
});

import { expect, test } from "bun:test";
import { SourceSet } from "../../frontend/sourceSet";
import { ModuleImports } from "../../model/moduleImport";
import { transpileKdjs } from "../../gcc/gccFromKdjs";

test("rewrites each block jsdoc comment in one replacement", () => {
  const input = `
/** @const {Record<string, () => bigint>} */
export const BIG_SPITTER = { "1": () => 1n, "2": () => 2n };`;

  const result = transpileKdjs(
    { path: "test.js", source: "module:test" },
    input,
    new SourceSet(),
    {},
    new ModuleImports()
  );

  expect(result).toBe(`
/** @const {!Object<string,function(): bigint>} */
export const BIG_SPITTER = { "1": () => 1n, "2": () => 2n };`);
});

test("adds module import extension even when specifier basename ends with ts", () => {
  const input = `
import bigints from "../util/bigints";

export const x = bigints.random(1);`;

  const result = transpileKdjs(
    { path: "crypto/minaSchnorr.js", source: "module:crypto/minaSchnorr" },
    input,
    new SourceSet(),
    {},
    new ModuleImports()
  );

  expect(result).toContain(`from "../util/bigints.ts"`);
});

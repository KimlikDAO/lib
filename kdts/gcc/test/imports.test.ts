import { test } from "bun:test";
import { expect } from "bun:test";
import { SourceSet } from "../../frontend/sourceSet";
import { ModuleImports } from "../../model/moduleImports";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("type-only imports synthesize Closure @const aliases", () => {
  expectEmit(`
    import type { LargeConstant as Marker } from "/kdts/kdts.d.ts";

    const value = 1;
  `, `
    /* gcc-js: import is replaced by alias import */
    /** @const */
    const Marker = kdts$$module$kdts$kdts_d$LargeConstant;
    const value = 1;
  `);
});

test("exported declarations stay exported", () => {
  const out = transpileTs(
    { id: "module:test", path: "/test.ts" },
    "export const answer = 42;\n",
    new SourceSet(),
    {},
    new ModuleImports()
  );
  expect(out).toContain("export const answer = 42;");
});

test("default export expressions keep their statement terminator", () => {
  expectEmit(`
    export default 7;
  `, `
    export default 7;
  `);
});

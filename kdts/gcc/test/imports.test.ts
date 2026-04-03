import { test } from "bun:test";
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

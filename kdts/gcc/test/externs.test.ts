import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileDts } from "../transpile";

const expectEmit = harness(transpileDts);

test("externs serialize type-only imports as alias imports", () => {
  expectEmit(`
    import { LargeConstant as Marker } from "/kdts/kdts.d.ts";
  `, `
    /** @fileoverview @externs */
    /** @const */
    const Marker = kdts$$module$kdts$kdts_d$LargeConstant;

  `);
});

test("externs lower default exports into aliased const declarations", () => {
  expectEmit(`
    declare var process: string;

    export default process;
  `, `
    /** @fileoverview @externs */
    /** @type {string} */
    let kdts$$module$test_d$process;
    /** @const */
    const kdts$$module$test_d$default = kdts$$module$test_d$process;
  `);
});

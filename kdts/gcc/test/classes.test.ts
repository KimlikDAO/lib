import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("classes", () => {
  expectEmit(`
    class Z<A, B> {}
  `, `
    /**
     * @template A, B
     */
    class Z {}
  `);
  expectEmit(`
    class Z<A, B, C extends string, D, E, F, G extends number> {}
  `, `
    /**
     * @template A, B
     * @template {string} C
     * @template D, E, F
     * @template {number} G
     */
    class Z {}
  `);
  expectEmit(`
    class Z<A = string, B extends string = "x", C = number, D extends number = 0> {}
  `, `
    /**
     * @template A
     * @template {string} B
     * @template C
     * @template {number} D
     */
    class Z {}
  `);
  expectEmit(`
    class Z<A extends FreshValue, B, C extends string, D extends FreshValue, E> {}
  `, `
    /**
     * @template A, B
     * @template {string} C
     * @template D, E
     */
    class Z {}
  `);
});

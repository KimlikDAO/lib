import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("LargeConstant satisfies unwraps to noinline declaration", () => {
  expectEmit(`
    const Table = [1, 2, 3] satisfies LargeConstant;
  `, `
    /**
     * @noinline
     */
    const Table = [1, 2, 3];
  `);

  expectEmit(`
    const Tiny = 1, Table = [1, 2, 3] satisfies LargeConstant;
  `, `
    /**
     * @noinline
     */
    const Table = [1, 2, 3];
    const Tiny = 1;
  `);
});

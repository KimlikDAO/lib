import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("arrays", () => {
  expectEmit(`
    const ShortAlphabet: readonly string[] = ["a", "b", "c"];`, `
    /** @const {!ReadonlyArray<string>} */
    const ShortAlphabet = ["a", "b", "c"];
  `);
  expectEmit(`
    const ShortAlphabet: readonly ["a", "b"] = ["a", "b"];`, `
    /** @const {!ReadonlyArray<string>} */
    const ShortAlphabet = ["a", "b"];
  `);
  expectEmit(`
    const ShortAlphabet: ["a", "b"] = ["a", "b"];`, `
    /** @const {!Array<string>} */
    const ShortAlphabet = ["a", "b"];
  `);
  expectEmit(`
    class HasArray {
      array = [1n, 2n];
    }`, `
    class HasArray {
      array = [1n, 2n];
    }
  `);
});

import { expect, test } from "bun:test";
import { transpileJs } from "../js";

test("exported const with type", () => {
  const input = `
/** @const {Record<string, () => bigint>} */
export const BIG_SPITTER = { "1": () => 1n, "2": () => 2n };`;

  const result = transpileJs(true, "test.js", input, [], {}, new Map());
  expect(result).toBe(`
/** @const {!Object<string,function(): bigint>} */
export const BIG_SPITTER = { "1": () => 1n, "2": () => 2n };
globalThis["KimlikDAOCompiler_exports"] = {
  "BIG_SPITTER": BIG_SPITTER,
};
`);
});

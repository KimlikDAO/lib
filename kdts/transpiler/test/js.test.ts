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

test("declaration import handling does not abort later top-level nodes", () => {
  const input = `import { Foo } from "./foo";
import { Bar } from "./bar";
export const BAZ = 1;`;

  const result = transpileJs(true, "test.d.js", input, [], {}, new Map());
  expect(result).toBe(`/**
 * @fileoverview
 * @externs
 */
; // gcc-js: type only imports are removed
; // gcc-js: type only imports are removed
;`);
});

test("declaration export handling does not abort later top-level nodes", () => {
  const input = `const Foo = 1;
export { Foo };
export default Foo;`;

  const result = transpileJs(true, "test.d.js", input, [], {}, new Map());
  expect(result).toBe(`/**
 * @fileoverview
 * @externs
 */
const Foo = 1;
;
;
globalThis["KimlikDAOCompiler_exports"] = {
  "KDdefault": Foo
};
`);
});

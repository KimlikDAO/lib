import { Comment } from "acorn";
import { expect, test } from "bun:test";
import { transpileJsDoc } from "../../gcc/jsdoc";

const makeComment = (commentStr: string): Comment => ({
  type: "Block",
  value: commentStr.slice(2, -2), // Remove /* and */
  start: 0,
  end: commentStr.length
});

test("@param {string|null}", () => {
  const comment = makeComment("/** @param {string|null} x */");
  const updated = transpileJsDoc(comment, "test.js");
  expect(updated).toBe("/** @param {?string} x */");
});

test("@param {(number|bigint)[]=}", () => {
  const text = "/** @param {(number|bigint)[]=} x */";
  const comment = makeComment(text);
  const updated = transpileJsDoc(comment, "test.js");
  expect(updated).toBe("/** @param {!Array<number|bigint>=} x */");
});

test("@const {(number|bigint)[]|()=>bigint}", () => {
  const text = "/** @const {(number|bigint)[] | () => bigint} x */";
  const comment = makeComment(text);
  const updated = transpileJsDoc(comment, "test.js");
  expect(updated).toBe("/** @const {!Array<number|bigint>|function(): bigint} x */");
});

test("@const {Record<string, string>}", () => {
  const text = "/** @const {Record<string, string>} */";
  const comment = makeComment(text);
  const updated = transpileJsDoc(comment, "test.js");
  expect(updated).toBe("/** @const {!Object<string,string>} */");
});

test("@param {...Type}", () => {
  const text = "/** @param {...Type} x */";
  const comment = makeComment(text);
  const updated = transpileJsDoc(comment, "test.js");
  expect(updated).toBe("/** @param {...!Type} x */");
});

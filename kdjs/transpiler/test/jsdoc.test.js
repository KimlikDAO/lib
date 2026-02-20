import { expect, test } from "bun:test";
import { update } from "../../util/textual";
import { transpileJsDoc } from "../jsdoc";

const makeComment = (commentStr) => ({
  type: "Block",
  value: commentStr.slice(2, -2), // Remove /* and */
  start: 0,
  end: commentStr.length
});

test("@param {string|null}", () => {
  const comment = makeComment("/** @param {string|null} x */");
  const updates = transpileJsDoc(comment);
  expect(updates.length).toBe(1);
  expect(updates[0].put).toBe("?string");
});

test("@param {(number|bigint)[]=}", () => {
  const text = "/** @param {(number|bigint)[]=} x */";
  const comment = makeComment(text);
  const updated = update(text, transpileJsDoc(comment));
  expect(updated).toBe("/** @param {!Array<number|bigint>=} x */");
});

test("@const {(number|bigint)[]|()=>bigint}", () => {
  const text = "/** @const {(number|bigint)[] | () => bigint} x */";
  const comment = makeComment(text);
  const updated = update(text, transpileJsDoc(comment));
  expect(updated).toBe("/** @const {!Array<number|bigint>|function(): bigint} x */");
});

test("@const {Record<string, string>}", () => {
  const text = "/** @const {Record<string, string>} */";
  const comment = makeComment(text);
  const updated = update(text, transpileJsDoc(comment));
  expect(updated).toBe("/** @const {!Object<string,string>} */");
});

test("@param {...Type}", () => {
  const text = "/** @param {...Type} x */";
  const comment = makeComment(text);
  const updated = update(text, transpileJsDoc(comment));
  expect(updated).toBe("/** @param {...!Type} x */");
});

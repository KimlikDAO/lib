import { expect, test } from "bun:test";
import { htmlTag } from "../markup/html";

test("htmlTag empty tag", () => {
  expect(htmlTag("tag", {}, false)).toBe("<tag>");
});

test("htmlTag self-closing", () => {
  expect(htmlTag("tag2", {}, true)).toBe("<tag2/>");
});

test("htmlTag boolean true omits value", () => {
  expect(htmlTag("tag", { a: 2, b: 3, d: 4, e: false }, false)).toBe(
    '<tag a="2" b="3" d="4">',
  );
  expect(
    htmlTag(
      "tag",
      { a: 2, b: 3, d: 4, e: true, f: null, g: undefined },
      false,
    ),
  ).toBe('<tag a="2" b="3" d="4" e>');
  expect(
    htmlTag(
      "tag",
      { a: 2, b: 3, d: 4, e: "true", f: null, g: undefined },
      false,
    ),
  ).toBe('<tag a="2" b="3" d="4" e="true">');
});

test("htmlTag preserves 0", () => {
  expect(htmlTag("tag", { a: 2, b: 3, d: 4, e: 0 }, false)).toBe(
    '<tag a="2" b="3" d="4" e="0">',
  );
});

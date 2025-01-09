import { describe, expect, it } from "bun:test";
import { tagYaz } from "../html";

describe("tagYaz tests", () => {
  it("should serialize empty tag", () => {
    expect(tagYaz("tag", {}, false)).toBe("<tag>");
  });

  it("should serialize self-closing tags", () => {
    expect(tagYaz("tag2", {}, true)).toBe("<tag2/>");
  });

  it("should shorten true values", () => {
    expect(tagYaz("tag", { a: 2, b: 3, d: 4, e: false }, false))
      .toBe('<tag a="2" b="3" d="4">');
    expect(tagYaz("tag", { a: 2, b: 3, d: 4, e: true, f: null, g: undefined }, false))
      .toBe('<tag a="2" b="3" d="4" e>');
    expect(tagYaz("tag", { a: 2, b: 3, d: 4, e: "true", f: null, g: undefined }, false))
      .toBe('<tag a="2" b="3" d="4" e="true">');
  });
  it("should preserve 0", () => {
    expect(tagYaz("tag", { a: 2, b: 3, d: 4, e: 0 }, false))
      .toBe('<tag a="2" b="3" d="4" e="0">');
  });
});

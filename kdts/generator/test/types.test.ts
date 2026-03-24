import { describe, expect, test } from "bun:test";
import { renderedTypeOf } from "./harness";

describe("type rendering", () => {
  test("literal union widens to string in emitted type", () => {
    expect(renderedTypeOf('let x: bigint | number | "LARGESTNUMBER";'))
      .toBe("bigint | number | string");
  });

  test("function type preserves this parameter", () => {
    expect(renderedTypeOf("let f: (this: User, a: bigint) => string;"))
      .toBe("(this: User, a: bigint) => string");
  });
});

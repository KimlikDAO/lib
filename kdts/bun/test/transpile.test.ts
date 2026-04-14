import { expect, test } from "bun:test";
import { stripIndent } from "../../util/testing/source";
import { transpileTs } from "../transpile";

test("transpileTs lowers satisfies PureExpr to a pure arrow iife", () => {
  expect(transpileTs(stripIndent(`
    import { PureExpr } from "@kimlikdao/kdts";

    const Uint256Max = "f".repeat(64) satisfies PureExpr;
  `), {})).toBe(stripIndent(`
    import { PureExpr } from "@kimlikdao/kdts";

    const Uint256Max = /*#__PURE__*/(()=>("f".repeat(64)))();
  `));
});

test("transpileTs keeps Overridable replacement working alongside PureExpr", () => {
  expect(transpileTs(stripIndent(`
    import { Overridable, PureExpr } from "@kimlikdao/kdts";

    const Host = "https://example.com" satisfies Overridable;
    const Value = Host.length satisfies PureExpr;
  `), {
    Host: "https://override.example",
  })).toBe(stripIndent(`
    import { Overridable, PureExpr } from "@kimlikdao/kdts";

    const Host = "https://override.example";
    const Value = /*#__PURE__*/(()=>(Host.length))();
  `));
});

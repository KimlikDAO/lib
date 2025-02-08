import { parseType } from "../parser";
import { it, expect } from "bun:test";

it("should parse", () => {
  const ast = parseType("!Array<number|string>|undefined");
  console.log(ast.toString());
})

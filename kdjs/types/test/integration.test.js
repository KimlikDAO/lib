import { describe, test, expect } from "bun:test";
import { parseType } from "../parser";

describe("Basics", () => {
  test("Type | null", () => {
    const kdjsExpr = "Type | null";
    const closureExpr = "Type";
    expect(parseType(kdjsExpr).toClosureExpr()).toBe(closureExpr);
  });

  test("{name:string,age:number}[]", () => {
    const kdjsExpr = "{name:string,age:number}[]";
    const closureExpr = "!Array<{ name: string, age: number }>";
    expect(parseType(kdjsExpr).toClosureExpr()).toBe(closureExpr);
  });
});

describe("Functions", () => {
  test("function with lambda", () => {
    const kdjsExpr =
      "(callback:(error:Error=)=>void,options?:{timeout:number}) => Promise<string>";
    const closureExpr =
      "function(function(!Error=), { timeout: number }=): !Promise<string>";

    expect(parseType(kdjsExpr).toClosureExpr()).toBe(closureExpr);
  });
});

describe("Constructors", () => {
  test("Arf curve constructor", () => {
    const kdjsExpr = "new (x: bigint, y: bigint, z?: bigint) => Point";
    const closureExpr = "function(new:Point, bigint, bigint, bigint=)";

    expect(parseType(kdjsExpr).toClosureExpr()).toBe(closureExpr);
  });
});

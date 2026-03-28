import { describe, expect, test } from "bun:test";
import { parseType } from "../../parser/typeParser";

describe("Basics", () => {
  test("Type | null", () => {
    const kdtsExpr = "Type | null";
    const closureExpr = "?Type";
    expect(parseType(kdtsExpr).toClosureExpr()).toBe(closureExpr);
  });

  test("{name:string,age:number}[]", () => {
    const kdtsExpr = "{name:string,age:number}[]";
    const closureExpr = "!Array<{ name: string, age: number }>";
    expect(parseType(kdtsExpr).toClosureExpr()).toBe(closureExpr);
  });
});

describe("Functions", () => {
  test("function with lambda", () => {
    const kdtsExpr =
      "(callback:(error:Error=)=>void,options?:{timeout:number}) => Promise<string>";
    const closureExpr =
      "function(function(!Error=), { timeout: number }=): !Promise<string>";

    expect(parseType(kdtsExpr).toClosureExpr()).toBe(closureExpr);
  });

  test("(...a: bigint[]) => void", () => {
    const kdtsExpr = "(...a: bigint[]) => void";
    const closureExpr = "function(...bigint)";

    expect(parseType(kdtsExpr).toClosureExpr()).toBe(closureExpr);
  });
});

describe("Constructors", () => {
  test("Arf curve constructor", () => {
    const kdtsExpr = "new (x: bigint, y: bigint, z?: bigint) => Point";
    const closureExpr = "function(new:Point, bigint, bigint, bigint=)";

    expect(parseType(kdtsExpr).toClosureExpr()).toBe(closureExpr);
  });
});

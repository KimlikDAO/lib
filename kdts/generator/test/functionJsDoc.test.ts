import { describe, expect, test } from "bun:test";
import { emitFirst, readJsDoc } from "./harness";
import type { JsDocParam } from "./harness";

type FunctionExpectation = {
  params: JsDocParam[] | Record<string, string>;
  returnType?: string | null;
  signature: string;
  tags?: string[];
  templates?: string[];
};

const normalizeParams = (params: FunctionExpectation["params"]): JsDocParam[] =>
  Array.isArray(params)
    ? params
    : Object.entries(params).map(([name, type]) => ({ name, type }));

const expectFunction = (
  input: string,
  {
    params,
    returnType = null,
    signature,
    tags = [],
    templates = []
  }: FunctionExpectation
) => (): void => {
  const out = emitFirst(input);
  const doc = readJsDoc(out);
  expect(doc.params).toEqual(normalizeParams(params));
  expect(doc.returnType).toBe(returnType);
  expect(doc.signature).toBe(signature);
  expect(doc.tags).toEqual(tags);
  expect(doc.templates).toEqual(templates);
};

describe("const = ArrowFunctionExpression", () => {
  test(
    "default number infers optional number",
    expectFunction("const f = (x: number, y = 2) => {};", {
      params: { "x": "number", "y": "number=" },
      signature: "const f = (x, y = 2) => {"
    })
  );

  test(
    "default string infers optional string",
    expectFunction('const f = (x: number, y = "1") => {};', {
      params: { "x": "number", "y": "string=" },
      signature: 'const f = (x, y = "1") => {'
    })
  );

  test(
    "default bigint infers optional bigint",
    expectFunction("const f = (x: number, y = 1n) => {};", {
      params: { "x": "number", "y": "bigint=" },
      signature: "const f = (x, y = 1n) => {"
    })
  );

  test(
    "default new expression preserves type arguments",
    expectFunction("const f = <K, V>(x = new Map<K, V>()) => {};", {
      params: { "x": "Map<K, V>=" },
      signature: "const f = (x = new Map()) => {",
      templates: ["K", "V"],
      tags: ["suppress"]
    })
  );

  test(
    "optional param emits optional JSDoc type",
    expectFunction("const f = (x: number, y?: string) => {};", {
      params: { "x": "number", "y": "string=" },
      signature: "const f = (x, y) => {"
    })
  );

  test(
    "function typed param preserves optional nested parameter",
    expectFunction("const f = (x: (y?: bigint) => bigint) => {};", {
      params: { "x": "(y?: bigint) => bigint" },
      signature: "const f = (x) => {"
    })
  );

  test(
    "rest param emits spread element type",
    expectFunction("const f = (...x: bigint[]) => {};", {
      params: { "x": "...bigint" },
      signature: "const f = (...x) => {"
    })
  );

  test(
    "readonly rest param unwraps to element type",
    expectFunction("const f = (...x: ReadonlyArray<bigint>) => {};", {
      params: { "x": "...bigint" },
      signature: "const f = (...x) => {"
    })
  );

  test(
    "templated function emits template and return type",
    expectFunction("const id = <T>(x: T): T => x;", {
      params: { "x": "T" },
      returnType: "T",
      signature: "const id = (x) => x;",
      templates: ["T"],
      tags: ["suppress"]
    })
  );
});

describe("const = FunctionExpression", () => {
  test.failing(
    "default number infers optional number",
    expectFunction("const f = function(x: number, y = 2) {};", {
      params: { "x": "number", "y": "number=" },
      signature: "const f = function(x, y = 2) {"
    })
  );

  test.failing(
    "rest param emits spread element type",
    expectFunction("const f = function(...x: bigint[]) {};", {
      params: { "x": "...bigint" },
      signature: "const f = function(...x) {"
    })
  );

  test.failing(
    "return type is emitted in JSDoc",
    expectFunction("const f = function(x: number): string { return String(x); };", {
      params: { "x": "number" },
      returnType: "string",
      signature: "const f = function(x) {"
    })
  );
});

describe("FunctionDeclaration", () => {
  test(
    "default number infers optional number",
    expectFunction("function f(x: number, y = 2) {}", {
      params: { "x": "number", "y": "number=" },
      signature: "function f(x, y = 2) {"
    })
  );

  test(
    "rest param emits spread element type",
    expectFunction("function f(...x: bigint[]) {}", {
      params: { "x": "...bigint" },
      signature: "function f(...x) {"
    })
  );

  test(
    "return type is emitted in JSDoc",
    expectFunction("function f(x: number): string { return String(x); }", {
      params: { "x": "number" },
      returnType: "string",
      signature: "function f(x) {"
    })
  );
});

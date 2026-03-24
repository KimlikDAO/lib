import { describe, expect, test } from "bun:test";
import { emitFirst, readJsDoc } from "./harness";
import type { JsDocParam } from "./harness";

type FunctionCase = {
  input: string;
  name: string;
  params: JsDocParam[];
  returnType?: string | null;
  signature: string;
  tags?: string[];
  templates?: string[];
};

const expectFunction = ({
  input,
  params,
  returnType = null,
  signature,
  tags = [],
  templates = []
}: FunctionCase): void => {
  const out = emitFirst(input);
  const doc = readJsDoc(out);
  expect(doc.params).toEqual(params);
  expect(doc.returnType).toBe(returnType);
  expect(doc.signature).toBe(signature);
  expect(doc.tags).toEqual(tags);
  expect(doc.templates).toEqual(templates);
};

describe("function JSDoc", () => {
  const cases: FunctionCase[] = [
    {
      name: "default number infers optional number",
      input: "const f = (x: number, y = 2) => {};",
      params: [
        { name: "x", type: "number" },
        { name: "y", type: "number=" }
      ],
      signature: "const f = (x, y = 2) => {"
    },
    {
      name: "default string infers optional string",
      input: 'const f = (x: number, y = "1") => {};',
      params: [
        { name: "x", type: "number" },
        { name: "y", type: "string=" }
      ],
      signature: 'const f = (x, y = "1") => {'
    },
    {
      name: "default bigint infers optional bigint",
      input: "const f = (x: number, y = 1n) => {};",
      params: [
        { name: "x", type: "number" },
        { name: "y", type: "bigint=" }
      ],
      signature: "const f = (x, y = 1n) => {"
    },
    {
      name: "default new expression preserves type arguments",
      input: "const f = <K, V>(x = new Map<K, V>()) => {};",
      params: [{ name: "x", type: "Map<K, V>=" }],
      signature: "const f = (x = new Map()) => {",
      templates: ["K", "V"],
      tags: ["suppress"]
    },
    {
      name: "optional param emits optional JSDoc type",
      input: "const f = (x: number, y?: string) => {};",
      params: [
        { name: "x", type: "number" },
        { name: "y", type: "string=" }
      ],
      signature: "const f = (x, y) => {"
    },
    {
      name: "function typed param preserves optional nested parameter",
      input: "const f = (x: (y?: bigint) => bigint) => {};",
      params: [{ name: "x", type: "(y?: bigint) => bigint" }],
      signature: "const f = (x) => {"
    },
    {
      name: "rest param emits spread element type",
      input: "const f = (...x: bigint[]) => {};",
      params: [{ name: "x", type: "...bigint" }],
      signature: "const f = (...x) => {"
    },
    {
      name: "readonly rest param unwraps to element type",
      input: "const f = (...x: ReadonlyArray<bigint>) => {};",
      params: [{ name: "x", type: "...bigint" }],
      signature: "const f = (...x) => {"
    },
    {
      name: "templated function emits template and return type",
      input: "const id = <T>(x: T): T => x;",
      params: [{ name: "x", type: "T" }],
      returnType: "T",
      signature: "const id = (x) => x;",
      templates: ["T"],
      tags: ["suppress"]
    }
  ];

  for (const testCase of cases) {
    test(testCase.name, () => {
      expectFunction(testCase);
    });
  }
});

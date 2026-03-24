import { describe, expect, test } from "bun:test";
import { TsParser } from "../../parser/tsParser";
import { Modifier } from "../../types/modifier";
import { emitFirst, stripIndent } from "./harness";

describe("declarations", () => {
  const cases = [
    {
      name: "typed let declarators are split and annotated",
      input: 'let x: number = 1, y: string = "1";',
      expected: `/** @type {number} */
let x = 1;
/** @type {string} */
let y = "1";`
    },
    {
      name: "all untyped declarators stay on one line",
      input: "const a = 1, b = 2;",
      expected: "const a = 1, b = 2;"
    },
    {
      name: "mixed typed and untyped declarators split only the typed one",
      input: "const x: number = 1, y = 2;",
      expected: `/** @const {number} */
const x = 1;
const y = 2;`
    },
    {
      name: "single typed const emits const JSDoc",
      input: "const x: number = 1;",
      expected: `/** @const {number} */
const x = 1;`
    },
    {
      name: "single untyped const stays plain",
      input: "const x = 1;",
      expected: "const x = 1;"
    },
    {
      name: "array destructuring works",
      input: "const [a,b,c,d] = g;",
      expected: "const [a, b, c, d] = g;"
    },
    {
      name: "readonly array type is preserved in JSDoc",
      input: "const chainGroups: readonly ChainGroup[] = [ChainGroup.EVM, ChainGroup.MINA];",
      expected: `/** @const {readonly ChainGroup[]} */
const chainGroups = [ChainGroup.EVM, ChainGroup.MINA];`
    }
  ];

  for (const { name, input, expected } of cases) {
    test(name, () => {
      expect(emitFirst(input)).toBe(stripIndent(expected));
    });
  }

  test("@define keeps its modifier and type", () => {
    const input = stripIndent(`
      /** @define */
      const N: bigint = 100n;
    `);
    const ast = TsParser.parse(input);
    expect((ast.body as any[])[0].modifiers).toBe(Modifier.Define);
    expect(emitFirst(input)).toBe("/** @define {bigint} */\nconst N = 100n;");
  });
});

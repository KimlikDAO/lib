import { describe, expect, test } from "bun:test";
import { Modifier } from "../../model/modifier";
import { TsParser } from "../../parser/tsParser";
import { emitFirst, stripIndent } from "./harness";

const expectFirstEmit = (input: string, expected: string) => (): void => {
  expect(emitFirst(input)).toBe(stripIndent(expected));
};

describe("declarations", () => {
  test(
    "typed let declarators are split and annotated",
    expectFirstEmit('let x: number = 1, y: string = "1";', `/** @type {number} */
let x = 1;
/** @type {string} */
let y = "1";`)
  );

  test(
    "all untyped declarators stay on one line",
    expectFirstEmit("const a = 1, b = 2;", "const a = 1, b = 2;")
  );

  test(
    "mixed typed and untyped declarators split only the typed one",
    expectFirstEmit("const x: number = 1, y = 2;", `/** @const {number} */
const x = 1;
const y = 2;`)
  );

  test(
    "single typed const emits const JSDoc",
    expectFirstEmit("const x: number = 1;", `/** @const {number} */
const x = 1;`)
  );

  test(
    "single untyped const stays plain",
    expectFirstEmit("const x = 1;", "const x = 1;")
  );

  test(
    "array destructuring works",
    expectFirstEmit("const [a,b,c,d] = g;", "const [a, b, c, d] = g;")
  );

  test(
    "readonly array type is preserved in JSDoc",
    expectFirstEmit(
      "const chainGroups: readonly ChainGroup[] = [ChainGroup.EVM, ChainGroup.MINA];",
      `/** @const {readonly ChainGroup[]} */
const chainGroups = [ChainGroup.EVM, ChainGroup.MINA];`
    )
  );

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

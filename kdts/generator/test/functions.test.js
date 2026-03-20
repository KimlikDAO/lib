import { describe, expect, test } from "bun:test";
import { TsParser } from "../../parser/tsParser";
import { generate } from "../kdjsFromAst";

/**
 * @param {string} code
 * @return {string}
 */
const transpile = (code) => generate(TsParser.parse(code));

describe("default values", () => {
  test("string literal without typeAnnotation", () => {
    const out = transpile('const f = (x: number, y = "1") => { }');
    expect(out).toContain(" * @param {string=} y");
    expect(out).toContain('const f = (x, y = "1") =>');
  })

  test("bigint literal without typeAnnotation", () => {
    const out = transpile('const f = (x: number, y = 1n) => { }');
    expect(out).toContain(" * @param {bigint=} y");
    expect(out).toContain('const f = (x, y = 1n) =>');
  })
});

describe("optional param", () => {
  test("optional param function type", () => {
    const out = transpile('const f = (x: (y?: bigint) => bigint) => { }');
    expect(out).toContain(" * @param {(y?: bigint) => bigint} x");
    expect(out).toContain('const f = (x) =>');
  })
  test("optional param arrow function", () => {
    const out = transpile("const f = (x: number, y?: string) => { }");
    expect(out).toContain(" * @param {string=} y");
    expect(out).toContain('const f = (x, y) =>');
  });
});

describe("spread", () => {
  test("spread param function type", () => {
    const out = transpile('const f = (x: (...y: bigint[]) => bigint) => { }');
    expect(out).toContain(" * @param {(...y: bigint[]) => bigint} x");
    expect(out).toContain('const f = (x) =>');
  });

  test("spread param function declaration", () => {
    const out = transpile('const f = (...x: bigint[]) => { }');
    expect(out).toContain(" * @param {...bigint} x");
    expect(out).toContain('const f = (...x) =>');
  });

  test("rest param readonly array unwraps to element type", () => {
    const out = transpile(`
const i18n = (
  strings: readonly string[],
  ...values: readonly Localizable[]
): I18nString => {}`);
    expect(out).toContain(" * @param {...Localizable} values");
  });

  test("rest param ReadonlyArray unwraps", () => {
    const out = transpile("const f = (...x: ReadonlyArray<bigint>) => {}");
    expect(out).toContain(" * @param {...bigint} x");
  });
});

import { expect, test } from "bun:test";
import { TsParser } from "../../parser/tsParser";
import { generate } from "../gccGenerator";

const renderType = (source: string): string => {
  const body = TsParser.parse(source).body as any[];
  return generate(body[0].declarations[0].id.typeAnnotation.typeAnnotation);
};

test("readonly array renders as ReadonlyArray", () => {
  expect(renderType("let x: readonly number[];"))
    .toBe("!ReadonlyArray<number>");
});

test("readonly tuple renders as ReadonlyArray of the first element", () => {
  expect(renderType("let x: readonly [number, string];"))
    .toBe("!ReadonlyArray<number>");
});

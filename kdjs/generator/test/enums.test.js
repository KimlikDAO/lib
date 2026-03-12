import { describe, expect, test } from "bun:test";
import { TsParser } from "../../parser/tsParser";
import { generate } from "../kdjsFromAst";

describe("Enums", () => {
  test("chains enum", () => {
    const ast = TsParser.parse(`
enum ChainId {
  x1 = "0x1",
  x144 = "0x144",
  x38 = "0x38",
  x406 = "0x406",
  x89 = "0x89",
  xa4b1 = "0xa4b1",
  xa86a = "0xa86a",
  xfa = "0xfa",
  MinaBerkeley = "mina:berkeley",
  MinaMainnet = "mina:mainnet",
  MinaTestnet = "mina:testnet",
}`);
    expect(generate(ast.body[0])).toBe(`
/** @enum {string} */
const ChainId = {
  x1: "0x1",
  x144: "0x144",
  x38: "0x38",
  x406: "0x406",
  x89: "0x89",
  xa4b1: "0xa4b1",
  xa86a: "0xa86a",
  xfa: "0xfa",
  MinaBerkeley: "mina:berkeley",
  MinaMainnet: "mina:mainnet",
  MinaTestnet: "mina:testnet"
};`.slice(1));
  });

  test("mixed enum (string and number) throws", () => {
    const ast = TsParser.parse(`enum Mixed { A = "a", B = 1 }`);
    expect(() => generate(ast.body[0])).toThrow(
      "Mixed enums (string and number) are not supported. Use a string-only or number-only enum: Mixed"
    );
  });
});

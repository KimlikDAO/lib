import { describe, expect, test } from "bun:test";
import { emitFirst, stripIndent } from "./harness";

describe("enums", () => {
  test("string enum emits @enum {string}", () => {
    const input = stripIndent(`
      enum ChainId {
        x1 = "0x1",
        x144 = "0x144",
        x38 = "0x38",
        MinaMainnet = "mina:mainnet",
      }
    `);

    expect(emitFirst(input)).toBe(stripIndent(`
      /** @enum {string} */
      const ChainId = {
        x1: "0x1",
        x144: "0x144",
        x38: "0x38",
        MinaMainnet: "mina:mainnet"
      };
    `).trimEnd());
  });

  test("mixed enum throws a focused error", () => {
    expect(() => emitFirst(`enum Mixed { A = "a", B = 1 }`)).toThrow(
      "Mixed enums (string and number) are not supported. Use a string-only or number-only enum: Mixed"
    );
  });
});

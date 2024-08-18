import { expect, test } from "bun:test";
import hex from "../hex";

test("hexToBinary on select values", () => {
  expect(hex.toBinary("AA")).toBe("10101010");
  expect(hex.toBinary("F")).toBe("1111");
});

test("to/from uint8Array", () => {
  /** @const {!Uint8Array} */
  const arr = hex.toUint8Array("ABCDEF");
  expect(hex.from(arr).toUpperCase()).toBe("ABCDEF");
});

test("to/from uint8Array with odd digits", () => {
  /** @const {!Uint8Array} */
  const arr = hex.toUint8Array("9ABCDEF");
  expect(hex.from(arr).toUpperCase()).toBe("09ABCDEF");
});

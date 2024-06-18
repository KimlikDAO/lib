import { describe, expect, it } from "bun:test";
import { hex, hexten } from "../çevir";

describe("çevir tests", () => {
  it("should convert binary to hex", () => {
    expect(hex(Uint8Array.from([1, 2, 3]))).toBe("010203");
  })

  it("should convert hex to binary", () => {
    expect(hexten("010203")).toEqual(Uint8Array.from([1, 2, 3]));
  })

  it("should handle missing leading zero", () => {
    expect(hexten("10203")).toEqual(Uint8Array.from([1, 2, 3]));
  })
})

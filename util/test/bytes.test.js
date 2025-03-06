import { describe, expect, test } from "bun:test";
import bytes from "../bytes";

describe("bytes utility functions", () => {
  describe("toUint32ArrayBE", () => {
    test("converts empty array", () => {
      const input = new Uint8Array([]);
      const result = bytes.toUint32ArrayBE(input);
      expect(result.length).toBe(0);
    });

    test("converts byte array with length multiple of 4", () => {
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08
      ]);
      const result = bytes.toUint32ArrayBE(input);

      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05060708);
    });

    test("converts byte array with length not multiple of 4 (length + 1)", () => {
      const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
      const result = bytes.toUint32ArrayBE(input);

      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05000000); // Implicit padding with zeros
    });

    test("converts byte array with length not multiple of 4 (length + 2)", () => {
      const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
      const result = bytes.toUint32ArrayBE(input);

      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05060000); // Implicit padding with zeros
    });

    test("converts byte array with length not multiple of 4 (length + 3)", () => {
      const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      const result = bytes.toUint32ArrayBE(input);

      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05060700); // Implicit padding with zeros
    });

    test("handles byte array with all possible byte values", () => {
      const input = new Uint8Array([0x00, 0xFF, 0x80, 0x7F]);
      const result = bytes.toUint32ArrayBE(input);

      expect(result.length).toBe(1);
      expect(result[0]).toBe(0x00FF807F);
    });
  });

  describe("fromUint32ArrayBE", () => {
    test("converts empty array", () => {
      const input = new Uint32Array([]);
      const result = bytes.fromUint32ArrayBE(input);
      expect(result.length).toBe(0);
    });

    test("converts word array to byte array", () => {
      const input = new Uint32Array([0x01020304, 0x05060708]);
      const result = bytes.fromUint32ArrayBE(input);

      expect(result.length).toBe(8);
      expect(result[0]).toBe(0x01);
      expect(result[1]).toBe(0x02);
      expect(result[2]).toBe(0x03);
      expect(result[3]).toBe(0x04);
      expect(result[4]).toBe(0x05);
      expect(result[5]).toBe(0x06);
      expect(result[6]).toBe(0x07);
      expect(result[7]).toBe(0x08);
    });

    test("handles word array with all possible bit patterns", () => {
      const input = new Uint32Array([0x00000000, 0xFFFFFFFF, 0x80000000, 0x7FFFFFFF]);
      const result = bytes.fromUint32ArrayBE(input);

      expect(result.length).toBe(16);
      // First word: 0x00000000
      expect(result[0]).toBe(0x00);
      expect(result[1]).toBe(0x00);
      expect(result[2]).toBe(0x00);
      expect(result[3]).toBe(0x00);
      // Second word: 0xFFFFFFFF
      expect(result[4]).toBe(0xFF);
      expect(result[5]).toBe(0xFF);
      expect(result[6]).toBe(0xFF);
      expect(result[7]).toBe(0xFF);
      // Third word: 0x80000000
      expect(result[8]).toBe(0x80);
      expect(result[9]).toBe(0x00);
      expect(result[10]).toBe(0x00);
      expect(result[11]).toBe(0x00);
      // Fourth word: 0x7FFFFFFF
      expect(result[12]).toBe(0x7F);
      expect(result[13]).toBe(0xFF);
      expect(result[14]).toBe(0xFF);
      expect(result[15]).toBe(0xFF);
    });
  });

  describe("roundtrip conversion", () => {
    test("roundtrip with length multiple of 4", () => {
      const original = new Uint8Array([
        0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08
      ]);
      const words = bytes.toUint32ArrayBE(original);
      const result = bytes.fromUint32ArrayBE(words);

      expect(result.length).toBe(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(result[i]).toBe(original[i]);
      }
    });

    test("roundtrip with length not multiple of 4", () => {
      const original = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      const words = bytes.toUint32ArrayBE(original);
      const result = bytes.fromUint32ArrayBE(words);

      // Note: result will be padded to a multiple of 4
      expect(result.length).toBe(8); // Rounded up to multiple of 4

      // Original bytes should match
      for (let i = 0; i < original.length; i++) {
        expect(result[i]).toBe(original[i]);
      }

      // Padding bytes should be zero
      expect(result[7]).toBe(0);
    });
  });
});

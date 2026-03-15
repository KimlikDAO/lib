import { describe, expect, test } from "bun:test";
import bytes from "../bytes";

describe("bytes", () => {
  describe("toUint32ArrayBE", () => {
    test("empty", () => {
      const input = new Uint8Array([]);
      const result = bytes.toUint32ArrayBE(input);
      expect(result.length).toBe(0);
    });

    test("length multiple of 4", () => {
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      ]);
      const result = bytes.toUint32ArrayBE(input);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05060708);
    });

    test("length + 1 (pad low bytes)", () => {
      const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
      const result = bytes.toUint32ArrayBE(input);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05000000);
    });

    test("length + 2", () => {
      const input = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
      const result = bytes.toUint32ArrayBE(input);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05060000);
    });

    test("length + 3", () => {
      const input = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      ]);
      const result = bytes.toUint32ArrayBE(input);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(0x01020304);
      expect(result[1]).toBe(0x05060700);
    });

    test("byte patterns", () => {
      const input = new Uint8Array([0x00, 0xff, 0x80, 0x7f]);
      const result = bytes.toUint32ArrayBE(input);
      expect(result.length).toBe(1);
      expect(result[0]).toBe(0x00ff807f);
    });
  });

  describe("fromUint32ArrayBE", () => {
    test("empty", () => {
      const input = new Uint32Array([]);
      const result = bytes.fromUint32ArrayBE(input);
      expect(result.length).toBe(0);
    });

    test("words to bytes", () => {
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

    test("bit patterns", () => {
      const input = new Uint32Array([
        0x00000000, 0xffffffff, 0x80000000, 0x7fffffff,
      ]);
      const result = bytes.fromUint32ArrayBE(input);
      expect(result.length).toBe(16);
      expect(result[0]).toBe(0x00);
      expect(result[1]).toBe(0x00);
      expect(result[2]).toBe(0x00);
      expect(result[3]).toBe(0x00);
      expect(result[4]).toBe(0xff);
      expect(result[5]).toBe(0xff);
      expect(result[6]).toBe(0xff);
      expect(result[7]).toBe(0xff);
      expect(result[8]).toBe(0x80);
      expect(result[9]).toBe(0x00);
      expect(result[10]).toBe(0x00);
      expect(result[11]).toBe(0x00);
      expect(result[12]).toBe(0x7f);
      expect(result[13]).toBe(0xff);
      expect(result[14]).toBe(0xff);
      expect(result[15]).toBe(0xff);
    });
  });

  describe("round trip", () => {
    test("length multiple of 4", () => {
      const original = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      ]);
      const words = bytes.toUint32ArrayBE(original);
      const result = bytes.fromUint32ArrayBE(words);
      expect(result.length).toBe(original.length);
      expect(result).toEqual(original);
    });

    test("length not multiple of 4", () => {
      const original = new Uint8Array([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      ]);
      const words = bytes.toUint32ArrayBE(original);
      const result = bytes.fromUint32ArrayBE(words);
      expect(result.length).toBe(8);
      expect(result[0]).toBe(0x01);
      expect(result[1]).toBe(0x02);
      expect(result[2]).toBe(0x03);
      expect(result[3]).toBe(0x04);
      expect(result[4]).toBe(0x05);
      expect(result[5]).toBe(0x06);
      expect(result[6]).toBe(0x07);
      expect(result[7]).toBe(0);
    });
  });
});

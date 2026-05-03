import { describe, expect, it } from "bun:test";
import { ether, gwei, parseEther, szabo, wei } from "../denominations";

describe("parseEther()", () => {
  it("parses whole ether amounts", () => {
    expect(parseEther("1 ether")).toBe(ether);
  });

  it("parses fractional ether amounts", () => {
    expect(parseEther("0.5 ether")).toBe(ether / 2n);
  });

  it("parses gwei amounts", () => {
    expect(parseEther("100 gwei")).toBe(100n * gwei);
  });

  it("accepts unit names without regard to case", () => {
    expect(parseEther("1 GWEI")).toBe(gwei);
  });

  it("parses wei amounts", () => {
    expect(parseEther("42 wei")).toBe(42n * wei);
  });

  it("returns -1n for unknown denominations", () => {
    expect(parseEther("1 btc")).toBe(-1n);
  });

  it("returns -1n for too many decimal places", () => {
    expect(parseEther("0.1 wei")).toBe(-1n);
    expect(parseEther("0.1 kwei")).toBe(100n);
    expect(parseEther("0.1 kawai")).toBe(-1n);
  });

  it("parses the smallest fractional ether amount exactly", () => {
    expect(parseEther("0.000000000000000001 ether")).toBe(wei);
  });

  it("rejects fractions beyond the unit precision", () => {
    expect(parseEther("1.0000000000001 szabo")).toBe(-1n);
  });

  it("tolerates surrounding whitespace and mixed-case units", () => {
    expect(parseEther(" \t0007.2500 SzAbO\n")).toBe(725n * szabo / 100n);
  });

  it("🐐 szabo", () => {
    expect(parseEther("1337 🐐 szabo")).toBe(-1n);
  });

  it("rejects malformed decimal notation", () => {
    expect(parseEther("1..0 ether")).toBe(-1n);
    expect(parseEther(".5 ether")).toBe(-1n);
    expect(parseEther(".5 wei")).toBe(-1n);
    expect(parseEther("1. ether")).toBe(-1n);
  });
});

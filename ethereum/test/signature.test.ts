import { describe, expect, it } from "bun:test";
import signature from "../signature";
import { WideSignature } from "../signature.d";

const WIDE_SIG = (
  "0x278f49cb66db8b104751fe3413dbf50e58288e66b625fa704b33255d06012295" +
  "6dc164431e9b78805da4bb590d2a8f7a340c89ed74ec04d054a3b49977ec6b4a1c"
) as WideSignature;
const COMPACT_SIG =
  "278f49cb66db8b104751fe3413dbf50e58288e66b625fa704b33255d06012295" +
  "edc164431e9b78805da4bb590d2a8f7a340c89ed74ec04d054a3b49977ec6b4a";

describe("fromWide()", () => {
  it("converts wide signature to EIP2098 compact form", () =>
    expect(signature.fromWide(WIDE_SIG)).toBe(COMPACT_SIG));
});

describe("toWide()", () => {
  it("converts compact EIP2098 signature to wide form", () =>
    expect(signature.toWide(COMPACT_SIG)).toBe(WIDE_SIG));
});

describe("fromWide() and toWide()", () => {
  it("roundtrips wide -> compact -> wide", () =>
    expect(signature.toWide(signature.fromWide(WIDE_SIG)))
      .toBe(WIDE_SIG));

  it("roundtrips compact -> wide -> compact", () =>
    expect(signature.fromWide(signature.toWide(COMPACT_SIG)))
      .toBe(COMPACT_SIG));
});

describe("fromUnpacked()", () => {
  it("packs r, s, yParity into EIP2098 compact signature", () => {
    const r = BigInt(
      "0x278f49cb66db8b104751fe3413dbf50e58288e66b625fa704b33255d06012295");
    const s = BigInt(
      "0x6dc164431e9b78805da4bb590d2a8f7a340c89ed74ec04d054a3b49977ec6b4a");
    expect(signature.fromUnpacked({ r, s, yParity: true })).toBe(COMPACT_SIG);
  });
});

describe("toWideFromUnpacked()", () => {
  it("packs unpacked signature to wide form with 1b for yParity false", () => {
    const sig = signature.toWideFromUnpacked({
      r: 0n,
      s: 1n,
      yParity: false
    });
    expect(sig.endsWith("1b")).toBeTrue();
  });

  it("packs unpacked signature to wide form with 1c for yParity true", () => {
    const sig = signature.toWideFromUnpacked({
      r: 0n,
      s: 1n,
      yParity: true
    });
    expect(sig.endsWith("1c")).toBeTrue();
  });
});

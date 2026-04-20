import { describe, expect, it } from "bun:test";
import { G } from "../../crypto/secp256k1";
import { keccak256 } from "../../crypto/sha3";
import address from "../address";
import signature from "../signature";
import { personalDigest, sign, signerAddress } from "../signer";

describe("personalDigest()", () => {
  it("returns keccak256 of EIP-191 message prefix plus message", () => {
    const digest = personalDigest("hello");
    expect(digest.length).toBe(64);
  });
});

describe("sign()", () => {
  it("returns compact EIP2098 signature (128 hex chars) for digest and private key", () => {
    const digest = keccak256("sign me!");
    const sig = sign(digest, 1n);

    const addr = signerAddress(digest, sig);
    expect(addr).toBe(address.fromPoint(G.copy().multiply(1n).proj()));
  });
});

describe("signerAddress()", () => {
  it("recovers signer from digest and signature (roundtrip with sign)", () => {
    const digest = keccak256("sign me!");
    for (let i = 1n; i < 100n; ++i) {
      expect(signerAddress(digest, sign(digest, i)))
        .toBe(address.fromPoint(G.copy().multiply(i).proj()));
    }
  });

  it("recovers expected address for known message and wide signature", () => {
    expect(signerAddress(
      personalDigest("140e575468d2a8dcbcc437e0f12e37606491f1621fe71239b99b793cd590b7f4"),
      signature.fromWide(
        "0x278f49cb66db8b104751fe3413dbf50e58288e66b625fa704b33255d06012295" +
        "6dc164431e9b78805da4bb590d2a8f7a340c89ed74ec04d054a3b49977ec6b4a1c")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(
      personalDigest("140e575468d2a8dcbcc437e0f12e37606491f1621fe71239b99b793cd590b7f4"),
      signature.fromWide(
        "0x278f49cb66db8b104751fe3413dbf50e58288e66b625fa704b33255d06012295" +
        "6dc164431e9b78805da4bb590d2a8f7a340c89ed74ec04d054a3b49977ec6b4a1c")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(
      personalDigest("92c0aea56bd108db8f41000707872c9e5f72bd79c10d9285ddf0e32c51791948"),
      signature.fromWide(
        "0x9400092866ff50e1d88014ca3cc3d878f6cecacc5ae8f752f3874c0b0584a90f" +
        "462f2947f7fbc119843e3c4319dc2da3cbb482745d42dd0e5a1cd27033270cbd1b")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(
      personalDigest("3e38bda94a98f1b3019dd7b48e050cbb18986724d1cfd29ceb9c8e57c7351866"),
      signature.fromWide(
        "0x09af513d1be6760e9a2e6bfa9b2166b337c2e2f830a3b75b01f41b25804c3710" +
        "44065ee77b34b36fd8a8ea9bda7acf4fd5ab7bf56879a33df8293d744784cb1e1b")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(
      personalDigest("İmza, KimlikDAO"),
      signature.fromWide(
        "0x6c8b90ce7867d3bab682a8d8ac47293e3b8e733b5c21843d9425da4de1fa4b4d" +
        "1495991af65b57164b042186c02bac62a292b3247e322aa4d1f9ab7519e87f4d1b")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(
      personalDigest("Signed, KimlikDAO"),
      signature.fromWide(
        "0xf0912fda0d8d456eaa711fa58c3788813fc7a0ebe3906f38a5b57f18dd379b69" +
        "3a7afde0f05e858af8be9d8c62ca03dac9d52dc9c8cc2c00a4d74cb875988dae1c")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(
      personalDigest("Çekoslovakyalılaştıramadıklarımızdanmışçasına"),
      signature.fromWide(
        "0x8b00f90e6920617f49daad913d8492534d85a7dfc2a2ec0f8de149870fda62a5" +
        "0f7abf9b7488d8304deb635248e45ba65099d3bfc86ff43711311d4b4b18e1e41b")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(
      personalDigest("Öşür yoğuşturup, aşı kovuşturmak. Iğdır’ın ilk harfi ı’dır."),
      signature.fromWide(
        "0x2a64a7063ca328bee1d612a327757389b73970598f0e964b1ef075de3937c198" +
        "728c381e23784ae164794f24bee158b569b20d17200315bcfacc7b6c0daae0601c")))
      .toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
  });

  it("recovers same address for multiple messages signed by same key", () => {
    const msg1 = personalDigest("92c0aea56bd108db8f41000707872c9e5f72bd79c10d9285ddf0e32c51791948");
    const sig1 = signature.fromWide(
      "0x9400092866ff50e1d88014ca3cc3d878f6cecacc5ae8f752f3874c0b0584a90f" +
      "462f2947f7fbc119843e3c4319dc2da3cbb482745d42dd0e5a1cd27033270cbd1b");
    const msg2 = personalDigest("İmza, KimlikDAO");
    const sig2 = signature.fromWide(
      "0x6c8b90ce7867d3bab682a8d8ac47293e3b8e733b5c21843d9425da4de1fa4b4d" +
      "1495991af65b57164b042186c02bac62a292b3247e322aa4d1f9ab7519e87f4d1b");
    expect(signerAddress(msg1, sig1)).toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
    expect(signerAddress(msg2, sig2)).toBe("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1");
  });
});

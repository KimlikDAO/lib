import { describe, expect, it } from "bun:test";
import evm from "../evm";

describe("adresDüzelt testleri", () => {
  it("should add checksum to lower case address", () => {
    expect(evm.adresDüzelt("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1"))
      .toBe("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1");
    expect(evm.adresDüzelt("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd".toLowerCase()))
      .toBe("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd");
  });

  it("should add checksum to upper case address", () => {
    expect(evm.adresDüzelt("0x" + "79883d9acbc4abac6d2d216693f66fcc5a0bcbc1".toUpperCase()))
      .toBe("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1");
  })

  it("should reject malformed checksum", () => {
    expect(evm.adresDüzelt("0x79883D9acbc4abac6d2d216693f66fcc5a0bcbc1"))
      .toBeNull();
    expect(evm.adresDüzelt("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbC1"))
      .toBeNull();
    expect(evm.adresDüzelt("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1dDd"))
      .toBeNull();
  });

  it("should preserve checksummed address", () => {
    expect(evm.adresDüzelt("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd"))
      .toBe("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd");
  })
})

describe("adresGeçerli tests", () => {
  it("should accept valid", () => {
    expect(evm.adresGeçerli("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd"))
      .toBeTrue();
    expect(evm.adresGeçerli("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1"))
      .toBeTrue();
  })

  it("should reject invalid", () => {
    expect(evm.adresGeçerli("0x79883D9acbc4aBac6d2d216693F66FcC5A0BcBC1"))
      .toBeFalse();
    expect(evm.adresGeçerli("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1dDd"))
      .toBeFalse();
  })
});

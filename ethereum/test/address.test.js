import { describe, expect, it } from "bun:test";
import address from "../address";

describe("validate tests", () => {
  it("should add checksum to lower case address", () => {
    expect(address.validate("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1"))
      .toBe("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1");
    expect(address.validate("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd".toLowerCase()))
      .toBe("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd");
  });

  it("should add checksum to upper case address", () => {
    expect(address.validate("0x" + "79883d9acbc4abac6d2d216693f66fcc5a0bcbc1".toUpperCase()))
      .toBe("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1");
  })

  it("should reject malformed checksum", () => {
    expect(address.validate("0x79883D9acbc4abac6d2d216693f66fcc5a0bcbc1"))
      .toBeNull();
    expect(address.validate("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbC1"))
      .toBeNull();
    expect(address.validate("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1dDd"))
      .toBeNull();
  });

  it("should preserve checksummed address", () => {
    expect(address.validate("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd"))
      .toBe("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd");
  })
})

describe("isValid tests", () => {
  it("should accept valid", () => {
    expect(address.isValid("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd"))
      .toBeTrue();
    expect(address.isValid("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1"))
      .toBeTrue();
  })

  it("should reject invalid", () => {
    expect(address.isValid("0x79883D9acbc4aBac6d2d216693F66FcC5A0BcBC1"))
      .toBeFalse();
    expect(address.isValid("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1dDd"))
      .toBeFalse();
  })
});

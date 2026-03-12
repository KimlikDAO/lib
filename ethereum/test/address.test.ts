import { describe, expect, it } from "bun:test";
import { G } from "../../crypto/secp256k1";
import address from "../address";

describe("fromPoint()", () => {
  it("returns the correct address for secp256k1 generator", () => {
    expect(address.fromPoint(G)).toBe("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
  });
});

describe("validate()", () => {
  it("adds checksum to lower case address", () => {
    expect(address.validate("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbc1"))
      .toBe("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1");
  });

  it("adds checksum to lower case address (alternate)", () => {
    expect(address.validate("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd".toLowerCase()))
      .toBe("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd");
  });

  it("adds checksum to upper case address", () => {
    expect(address.validate("0x" + "79883d9acbc4abac6d2d216693f66fcc5a0bcbc1".toUpperCase()))
      .toBe("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1");
  });

  it("rejects malformed checksum (wrong casing)", () => {
    expect(address.validate("0x79883D9acbc4abac6d2d216693f66fcc5a0bcbc1")).toBeNull();
  });

  it("rejects malformed checksum (wrong casing in tail)", () => {
    expect(address.validate("0x79883d9acbc4abac6d2d216693f66fcc5a0bcbC1")).toBeNull();
  });

  it("rejects malformed checksum (mixed case invalid)", () => {
    expect(address.validate("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1dDd")).toBeNull();
  });

  it("preserves already checksummed address", () => {
    expect(address.validate("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd"))
      .toBe("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd");
  });
});

describe("isValid()", () => {
  it("returns true for valid checksummed address", () => {
    expect(address.isValid("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1ddd")).toBeTrue();
  });

  it("returns true for another valid checksummed address", () => {
    expect(address.isValid("0x79883D9aCBc4aBac6d2d216693F66FcC5A0BcBC1")).toBeTrue();
  });

  it("returns false for invalid checksum", () => {
    expect(address.isValid("0x79883D9acbc4abac6d2d216693f66fcc5a0bcbc1")).toBeFalse();
  });

  it("returns false for another invalid checksum", () => {
    expect(address.isValid("0xdDd1AC04c9251B74B0B30A20FC7cb26Eb62b1dDd")).toBeFalse();
  });
});

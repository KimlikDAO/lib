import { describe, expect, test } from "bun:test";
import address from "../address";
import { addr } from "../mock/signer";

describe("PublicKey", () => {
  test("to/from base58", () => {
    const knownAddr =
      "B62qoDr5nqJqKVRU4SyG2gUtZ8QeiXZ2N9C5s5amfMCkGtJxVor4bSg";
    const pubKey = address.toPublicKey(knownAddr);

    expect(pubKey.x).toBe(
      15700009165632333463033215207293744423217119730549469715303355600196922327182n);
    expect(pubKey.yParity).toBeTrue();
    expect(address.fromPublicKey(pubKey)).toBe(knownAddr);
  });

  test("address → toPublicKey → fromPublicKey → same address", () => {
    const b62 = addr(0x1337n);
    expect(address.fromPublicKey(address.toPublicKey(b62))).toBe(b62);
  });
});

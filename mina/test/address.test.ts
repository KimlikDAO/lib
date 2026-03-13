import { describe, expect, test } from "bun:test";
import address from "../address";

describe("PublicKey", () => {
  test("to/from base58", () => {
    const addr = "B62qoDr5nqJqKVRU4SyG2gUtZ8QeiXZ2N9C5s5amfMCkGtJxVor4bSg";
    const pubKey = address.toPublicKey(addr);

    expect(pubKey.x).toBe(
      15700009165632333463033215207293744423217119730549469715303355600196922327182n
    );
    expect(pubKey.yParity).toBeTrue();
    expect(address.fromPublicKey(pubKey)).toBe(addr);
  });
});

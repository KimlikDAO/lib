import { describe, expect, test } from "bun:test";
import { PublicKey } from "../mina";

describe("PublicKey", () => {
  test("to/from base58", () => {
    /** @const {string} */
    const pk58 = "B62qoDr5nqJqKVRU4SyG2gUtZ8QeiXZ2N9C5s5amfMCkGtJxVor4bSg";
    /** @const {PublicKey} */
    const pk = PublicKey.fromBase58(pk58);

    expect(pk.x).toBe(
      15700009165632333463033215207293744423217119730549469715303355600196922327182n
    );
    expect(pk.isOdd).toBeTrue();

    expect(pk.toBase58()).toBe(pk58);
  });

  test("serialize into / deserialize from bytes", () => {
    /** @const {PublicKey} */
    const pk = new PublicKey(123123n, true);
    /** @const {Uint8Array} */
    const buff = new Uint8Array(32);

    pk.serializeInto(buff);
    /** @const {PublicKey} */
    const pk2 = PublicKey.fromBytes(buff);

    expect(pk2).toEqual(pk);
  })
});

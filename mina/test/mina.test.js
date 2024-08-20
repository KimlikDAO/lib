import { describe, expect, test } from "bun:test";
import { G, Point } from "../../crypto/minaSchnorr";
import { parsePrivateKey, PublicKey, signFields, verifyFields } from "../mina";

describe("PublicKey", () => {
  test("to/from base58", () => {
    /** @const {string} */
    const pk58 = "B62qoDr5nqJqKVRU4SyG2gUtZ8QeiXZ2N9C5s5amfMCkGtJxVor4bSg";
    /** @const {!PublicKey} */
    const pk = PublicKey.fromBase58(pk58);

    expect(pk.x).toBe(
      15700009165632333463033215207293744423217119730549469715303355600196922327182n
    );
    expect(pk.isOdd).toBeTrue();

    expect(pk.toBase58()).toBe(pk58);
  });

  test("to/from Point", () => {
    /** @const {!Point} */
    const X = G.copy().multiply(0x13371337n).project();
    /** @const {!PublicKey} */
    const pk = PublicKey.fromPoint(X);
    expect(pk.toPoint()).toEqual(X);
  });
});

describe("sign/verify fields", () => {
  test("smoke tests", () => {
    /** @const {bigint} */
    const s = parsePrivateKey("EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S");
    /** @const {!Point} */
    const X = G.copy().multiply(s).project();
    /** @const {mina.SignerSignature} */
    const sig = signFields([1n, 31n, 1337n], s);
    expect(sig.signer).toBe(PublicKey.fromPoint(X).toBase58());
    expect(verifyFields([1n, 31n, 1337n], sig)).toBeTrue();
  });
});

import { describe, expect, test } from "bun:test";
import { G, Point } from "../../crypto/minaSchnorr";
import { parsePrivateKey, PublicKey } from "../mina";
import mina from "../mina.d";
import { signFields, verifyFields } from "../signer";

test("to/from Point", () => {
  /** @const {Point} */
  const X = G.copy().multiply(0x13371337n).project();
  /** @const {PublicKey} */
  const pk = PublicKey.fromPoint(X);
  expect(pk.toPoint()).toEqual(X);
});

describe("sign/verify fields", () => {
  test("smoke tests", () => {
    /** @const {bigint} */
    const s = parsePrivateKey("EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S");
    /** @const {Point} */
    const X = G.copy().multiply(s).project();
    /** @const {mina.SignerSignature} */
    const sig = signFields([1n, 31n, 1337n], s);
    expect(sig.signer).toBe(PublicKey.fromPoint(X).toBase58());
    expect(verifyFields([1n, 31n, 1337n], sig)).toBeTrue();
  });
});

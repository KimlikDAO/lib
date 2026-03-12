import { describe, expect, test } from "bun:test";
import { compressPoint } from "../../crypto/ellipticCurve";
import { G } from "../../crypto/minaSchnorr";
import address from "../address";
import { parsePrivateKey } from "../encoding";
import { signFields, verifyFields } from "../signer";

test("to/from Point", () => {
  const A = G.copy().multiply(0x13371337n).proj();
  const addr = address.fromPoint(A);
  expect(address.toPublicKey(addr)).toEqual(compressPoint(A));
});

describe("sign/verify fields", () => {
  test("smoke tests", () => {
    const s = parsePrivateKey("EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S");
    const A = G.copy().multiply(s).proj();
    const sig = signFields([1n, 31n, 1337n], s);
    expect(sig.signer).toBe(address.fromPoint(A));
    expect(verifyFields([1n, 31n, 1337n], sig)).toBeTrue();
  });
});

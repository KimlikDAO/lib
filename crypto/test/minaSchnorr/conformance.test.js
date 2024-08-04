import { expect, test } from "bun:test";
import { Client } from "mina-signer";
import { Field, Scalar, Signature } from "o1js";
import { parsePrivateKey, parseSignature } from "../../../mina/mina";
import { G, signFields, verifyFields } from "../../minaSchnorr";

test("sign with mina-signer, verify with ours", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";

  /** @const {!bigint} */
  const privKey = parsePrivateKey(privKey58);
  const pubKey = G.copy().multiply(privKey).project();

  const sig = client.signFields([1n, 2n, 3n], privKey58);
  const { r, s } = parseSignature(sig.signature);

  expect(client.verifyFields(sig)).toBeTrue();
  expect(verifyFields([1n, 2n, 3n], r, s, pubKey)).toBeTrue();
});

test("sign with mina-signer, verify with ours", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";

  /** @const {!bigint} */
  const privKey = parsePrivateKey(privKey58);
  const pubKey = G.copy().multiply(privKey).project();

  const sig = client.signFields([1n, 2n, 3n, 69n, 31n], privKey58);
  const { r, s } = parseSignature(sig.signature);

  expect(client.verifyFields(sig)).toBeTrue();
  expect(verifyFields([1n, 2n, 3n, 69n, 31n], r, s, pubKey)).toBeTrue();
});

test("sign with ours, verify with mina-signer", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";
  const privKey = parsePrivateKey(privKey58);
  const { r, s } = signFields([31n, 31n, 69n], privKey);
  const signature = Signature.fromObject({ r: Field(r), s: Scalar.from(s) }).toBase58();
  const signedFields = /** @type {minaSigner.SignedFields} */({
    data: [31n, 31n, 69n],
    signature,
    publicKey: client.derivePublicKey(privKey58)
  });
  expect(client.verifyFields(signedFields)).toBeTrue();
});

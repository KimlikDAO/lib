import { expect, test } from "bun:test";
import { Client } from "mina-signer";
import { parsePrivateKey } from "../../../mina/mina";
import { G, sign, verify } from "../../minaSchnorr";

test("sign with mina-signer, verify with ours", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";

  /** @const {!bigint} */
  const privKey = parsePrivateKey(privKey58);
  const pubKey = G.copy().multiply(privKey).project();

  const sig = client.signMessage("abcd", privKey58);
  /** @const {!bigint} */
  const r = BigInt(sig.signature.field);
  /** @const {!bigint} */
  const s = BigInt(sig.signature.scalar);

  expect(client.verifyMessage(sig)).toBeTrue();
  expect(verify("abcd", r, s, pubKey)).toBeTrue();
});

test("sign with ours, verify with mina-signer", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";
  const privKey = parsePrivateKey(privKey58);
  const { r, s } = sign("KimlikDAO", privKey);
  const signedMessage = /** @type {minaSigner.SignedMessage} */({
    data: "KimlikDAO",
    signature: {
      field: r.toString(),
      scalar: s.toString()
    },
    publicKey: client.derivePublicKey(privKey58)
  });
  expect(client.verifyMessage(signedMessage)).toBeTrue();
});

test("sign multiple fields, i.e., >254 bits", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";
  const privKey = parsePrivateKey(privKey58);
  const { r, s } = sign("KimlikDAO".repeat(10), privKey);
  const signedMessage = /** @type {minaSigner.SignedMessage} */({
    data: "KimlikDAO".repeat(10),
    signature: {
      field: r.toString(),
      scalar: s.toString()
    },
    publicKey: client.derivePublicKey(privKey58)
  });
  expect(client.verifyMessage(signedMessage)).toBeTrue();
});

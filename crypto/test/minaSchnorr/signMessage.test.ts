import { expect, test } from "bun:test";
import { Client } from "mina-signer";
import { parsePrivateKey } from "../../../mina/encoding";
import { compressPoint } from "../../ellipticCurve";
import { G, signMessage, verifyMessage } from "../../minaSchnorr";

test("sign with mina-signer, verify with ours", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";

  const privKey = parsePrivateKey(privKey58);
  const pubKey = compressPoint(G.copy().multiply(privKey).proj());

  const data = "abcd";
  const sig = client.signMessage(data, privKey58);
  const r = BigInt(sig.signature.field);
  const s = BigInt(sig.signature.scalar);

  expect(client.verifyMessage(sig)).toBeTrue();
  expect(verifyMessage(data, r, s, pubKey)).toBeTrue();
});

test("sign with ours, verify with mina-signer", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";
  const privKey = parsePrivateKey(privKey58);
  const data = "KimlikDAO";
  const { r, s } = signMessage(data, privKey);
  const signedMessage = {
    data,
    signature: {
      field: r.toString(),
      scalar: s.toString()
    },
    publicKey: client.derivePublicKey(privKey58)
  } as minaSigner.SignedMessage;
  expect(client.verifyMessage(signedMessage)).toBeTrue();
});

test("sign multiple fields, i.e., >254 bits", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";
  const privKey = parsePrivateKey(privKey58);
  const { r, s } = signMessage("KimlikDAO".repeat(10), privKey);
  const signedMessage = {
    data: "KimlikDAO".repeat(10),
    signature: {
      field: r.toString(),
      scalar: s.toString()
    },
    publicKey: client.derivePublicKey(privKey58)
  } as minaSigner.SignedMessage;
  expect(client.verifyMessage(signedMessage)).toBeTrue();
});

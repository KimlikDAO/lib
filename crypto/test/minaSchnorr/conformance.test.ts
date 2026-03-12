import { expect, test } from "bun:test";
import { Client } from "mina-signer";
import { parsePrivateKey } from "../../../mina/encoding";
import signature from "../../../mina/signature";
import { compressPoint } from "../../ellipticCurve";
import { G, signFields, verifyFields } from "../../minaSchnorr";

test("sign with mina-signer, verify with ours", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";

  const privKey = parsePrivateKey(privKey58);
  const pubKey = compressPoint(G.copy().multiply(privKey).proj());

  const sig = client.signFields([1n, 2n, 3n], privKey58);
  const { r, s } = signature.toUnpacked(sig.signature);

  expect(client.verifyFields(sig)).toBeTrue();
  expect(verifyFields([1n, 2n, 3n], r, s, pubKey)).toBeTrue();
});

test("sign with mina-signer, verify with ours", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";

  const privKey = parsePrivateKey(privKey58);
  const pubKey = compressPoint(G.copy().multiply(privKey).proj());

  const sig = client.signFields([1n, 2n, 3n, 69n, 31n], privKey58);
  const { r, s } = signature.toUnpacked(sig.signature);

  expect(client.verifyFields(sig)).toBeTrue();
  expect(verifyFields([1n, 2n, 3n, 69n, 31n], r, s, pubKey)).toBeTrue();
});

test("sign with ours, verify with mina-signer", () => {
  const client = new Client({ network: "mainnet" });
  const privKey58 = "EKF5WGqhkg3yQyiRU2gWC1W1KLw2xLuRgwtQNEbZ5qWqGYpktw8S";
  const privKey = parsePrivateKey(privKey58);
  const { r, s } = signFields([31n, 31n, 69n], privKey);
  const sig = signature.fromUnpacked({ r, s });
  const signedFields = {
    data: [31n, 31n, 69n],
    signature: sig,
    publicKey: client.derivePublicKey(privKey58)
  } as minaSigner.SignedFields;
  expect(client.verifyFields(signedFields)).toBeTrue();
});

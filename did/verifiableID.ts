/**
 * @fileoverview A preliminary VerifiableID implementation.
 *
 * @author KimlikDAO
 */

import { keccak256Uint32, keccak256Uint32ToHex } from "../crypto/sha3";
import { evaluate, generateChallenge, reconstructY } from "../crypto/wesolowski";
import base64 from "../util/base64";
import { VerifiableID } from "./verifiableID.d";

const KIMLIKDAO_VERIFIABLE_ID_LOG_ITERATIONS = 20;
const KIMLIKDAO_VERIFIABLE_ID_ITERATIONS = 1 << 20;

/** @pure */
const prepareGenerateKey = (privateKey: string): Promise<CryptoKey> => crypto.subtle.importKey(
  "pkcs8",
  base64.toBytes(privateKey), {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256"
  } as RsaHashedImportParams, false, ["sign"]
);

/** @pure */
const generate = (personKey: string, generateKey: CryptoKey): Promise<VerifiableID> =>
  crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", generateKey, new TextEncoder().encode(personKey)
  ).then((signature: ArrayBuffer) => {
    const g = keccak256Uint32(new Uint32Array(signature));
    const { y, π, l } = evaluate(g, KIMLIKDAO_VERIFIABLE_ID_ITERATIONS);
    return {
      id: keccak256Uint32ToHex(y),
      x: base64.from(new Uint8Array(signature)),
      wesolowskiP: base64.fromBigInt(π),
      wesolowskiL: base64.fromBigInt(l),
    } as VerifiableID;
  });

/** @pure */
const verify = (
  verifiableID: VerifiableID,
  personKey: string,
  publicKey: string
): Promise<boolean> => {
  if (!verifiableID.x || !verifiableID.wesolowskiP || !verifiableID.wesolowskiL)
    return Promise.resolve(false);
  const x = new Uint32Array(base64.toBytes(verifiableID.x).buffer as ArrayBuffer);
  const g = keccak256Uint32(x);
  const π = base64.toBigInt(verifiableID.wesolowskiP);
  const l = base64.toBigInt(verifiableID.wesolowskiL);
  const y = reconstructY(KIMLIKDAO_VERIFIABLE_ID_LOG_ITERATIONS, g, π, l);

  if (keccak256Uint32ToHex(y) != verifiableID.id)
    return Promise.resolve(false);
  if (generateChallenge(g, y) != l)
    return Promise.resolve(false);
  return crypto.subtle.importKey(
    "spki", base64.toBytes(publicKey), {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    } as RsaHashedImportParams, false, ["verify"]
  ).then((verifyKey: CryptoKey) => crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", verifyKey, x, new TextEncoder().encode(personKey)
  ))
}

export {
  generate,
  prepareGenerateKey,
  verify
};

import { recoverSigner, sign as signUnpacked } from "../crypto/secp256k1";
import { keccak256Uint8 } from "../crypto/sha3";
import abi from "./abi";
import address from "./address";
import { Address } from "./address.d";
import { Signature } from "./signature.d";

/**
 * Given a digest and a signature, recovers the signer address if the signature
 * is valid; outputs a the "zero address" otherwise.
 * Here the zero address, corresponding to the public key (0,0) is
 *
 *   0x3f17f1962b36e491b30a40b2405849e597ba5fb5.
 *
 * @satisfies {PureFn}
 */
const signerAddress = (digest: string, signature: Signature): Address => {
  const highNibble = parseInt(signature[64], 16);
  const yParity = highNibble >= 8;
  const r = BigInt("0x" + signature.slice(0, 64));
  const s = BigInt("0x" + (yParity
    ? (highNibble - 8).toString(16) + signature.slice(65)
    : signature.slice(64))
  );
  return address.fromPoint(
    recoverSigner(BigInt("0x" + digest), r, s, yParity));
}

/** @satisfies {PureFn} */
const sign = (digest: string, privateKey: bigint): Signature => {
  const { r, s, yParity } = signUnpacked(BigInt("0x" + digest), privateKey);
  return abi.uint256(r) + abi.uint256(yParity ? s + (1n << 255n) : s);
}

/** @satisfies {PureFn} */
const personalDigest = (msg: string): string => {
  const encoder = new TextEncoder();
  const msgEncoded = encoder.encode(msg);
  const lenEncoded = encoder.encode("" + msgEncoded.length);
  const encoded = new Uint8Array(26 + lenEncoded.length + msgEncoded.length);
  encoder.encodeInto("\x19Ethereum Signed Message:\n", encoded);
  encoded.set(lenEncoded, 26);
  encoded.set(msgEncoded, 26 + lenEncoded.length);
  return keccak256Uint8(encoded).toHex();
}

export {
  personalDigest,
  sign,
  signerAddress
};

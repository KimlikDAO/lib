import { Point, recoverSigner, sign as signUnpacked } from "../crypto/secp256k1";
import { keccak256Uint32, keccak256Uint8 } from "../crypto/sha3";
import bigints from "../util/bigints";
import hex from "../util/hex";
import abi from "./abi";
import { Address } from "./address.d";
import { Signature } from "./signature.d";

/**
 * @param {Point} Q
 * @return {Address} address
 */
const pointToAddress = (Q) => {
  /** @const {Uint8Array} */
  const bytes = new Uint8Array(64);
  bigints.intoBytesBE(bytes, 32, Q.x);
  bigints.intoBytesBE(bytes, 64, Q.y);
  /** @const {Uint8Array} */
  const hash = new Uint8Array(
    keccak256Uint32(new Uint32Array(bytes.buffer)).buffer, 12, 20);
  return "0x" + hex.from(hash);
}

/**
 * Given a digest and a signature, recovers the signer address if the signature
 * is valid; outputs an arbitrary value otherwise.
 *
 * @param {string} digest as a length 64 hex string
 * @param {Signature} signature as a length 128 compact signature
 * @return {Address} 42 characters long EVM address
 */
const signerAddress = (digest, signature) => {
  /** @const {number} */
  const highNibble = parseInt(signature[64], 16);
  /** @const {boolean} */
  const yParity = highNibble >= 8;
  /** @const {bigint} */
  const r = BigInt("0x" + signature.slice(0, 64));
  /** @const {bigint} */
  const s = BigInt("0x" + (yParity
    ? (highNibble - 8).toString(16) + signature.slice(65)
    : signature.slice(64))
  );
  return pointToAddress(
    recoverSigner(BigInt("0x" + digest), r, s, yParity));
}

/**
 * @param {string} digest
 * @param {bigint} privateKey
 * @return {Signature}
 */
const sign = (digest, privateKey) => {
  const { r, s, yParity } = signUnpacked(BigInt("0x" + digest), privateKey);
  return abi.uint256(r) + abi.uint256(yParity ? s + (1n << 255n) : s);
}

/**
 * @param {string} msg
 * @return {string} hex encoded hash
 */
const personalDigest = (msg) => {
  /** @const {TextEncoder} */
  const encoder = new TextEncoder();
  /** @const {Uint8Array} */
  const msgEncoded = encoder.encode(msg);
  /** @const {Uint8Array} */
  const lenEncoded = encoder.encode("" + msgEncoded.length);
  /** @const {Uint8Array} */
  const encoded = new Uint8Array(26 + lenEncoded.length + msgEncoded.length);
  encoder.encodeInto("\x19Ethereum Signed Message:\n", encoded);
  encoded.set(lenEncoded, 26);
  encoded.set(msgEncoded, 26 + lenEncoded.length);
  return hex.from(keccak256Uint8(encoded));
}

export {
  personalDigest,
  pointToAddress,
  sign,
  signerAddress
};

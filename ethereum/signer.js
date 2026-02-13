import { Point, recoverSigner, sign } from "../crypto/secp256k1";
import { keccak256Uint32 } from "../crypto/sha3";
import bigints from "../util/bigints";
import hex from "../util/hex";
import { Address, CompactSignature } from "./ethereum.d";
import evm from "./evm";

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
 * @param {CompactSignature} signature as a length 128 compact signature
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
 * @return {CompactSignature}
 */
const signCompact = (digest, privateKey) => {
  const { r, s, yParity } = sign(BigInt("0x" + digest), privateKey);
  return evm.uint256(r) + evm.uint256(yParity ? s + (1n << 255n) : s);
}

export {
  pointToAddress,
  signCompact,
  signerAddress
};

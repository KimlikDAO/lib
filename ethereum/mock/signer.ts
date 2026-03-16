import { Signature, Signer } from "../../crosschain/signer";
import { inverse } from "../../crypto/modular";
import { G, Q } from "../../crypto/secp256k1";
import { keccak256Uint32, keccak256Uint32ToHex } from "../../crypto/sha3";
import bigints from "../../util/bigints";
import hex from "../../util/hex";
import abi from "../abi";
import signature, { UnpackedSignature } from "../signature";
import { Signature as EthereumSignature, WideSignature } from "../signature.d";
import { personalDigest } from "../signer";

const addr = (privKey: bigint): string => {
  const { x, y } = G.copy().multiply(privKey).proj();
  const buff = hex.toUint8Array(abi.uint256(x) + abi.uint256(y));
  return "0x" + hex.from(new Uint8Array(
    keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 12, 20));
};

/**
 * Deterministically sign a given `digest` with the `privKey`.
 *
 * Note that derivation of the `K` point is deterministic but non-standard, so
 * the created signature will not match that of the common ethereum wallets.
 *
 * TODO(KimlikDAO-bot): Implement standard deterministic signatures.
 */
const signUnpacked = (digest: bigint, privKey: bigint): UnpackedSignature => {
  const bytes = new Uint8Array(64);
  bigints.intoBytesBE(bytes, digest, 32);
  bigints.intoBytesBE(bytes, privKey, 64);
  const buff = new Uint32Array(bytes.buffer);

  for (; ; ++buff[0]) {
    const k = BigInt("0x" + keccak256Uint32ToHex(buff));
    if (k <= 0 || Q <= k) continue;
    const { x: r, y } = G.copy().multiply(k).proj();
    if (r >= Q) continue;
    let s = (inverse(k, Q) * ((digest + r * privKey) % Q)) % Q;
    if (s == 0n) continue;
    let yParity = !!(y & 1n);
    if (s > (Q >> 1n)) {
      s = Q - s;
      yParity = !yParity;
    }
    return { r, s, yParity };
  }
};

const signWide = (digest: bigint, privKey: bigint): WideSignature =>
  signature.toWideFromUnpacked(signUnpacked(digest, privKey));

const sign = (digest: bigint, privKey: bigint): EthereumSignature =>
  signature.fromUnpacked(signUnpacked(digest, privKey));

class MockSigner implements Signer {
  constructor(readonly privKey: bigint) { }
  /**
   * Returns a deterministic but non RFC-6979 compliant signature if the
   * provided address is the signer's address; returns `Promise.reject()`
   * otherwise.
   */
  signMessage(message: string, address: string): Promise<Signature> {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    const digest = BigInt("0x" + personalDigest(message));
    return Promise.resolve("0x" + sign(digest, this.privKey));
  }
  getAddress(): string {
    return addr(this.privKey);
  }
  deriveSecret(message: string, address: string): Promise<ArrayBuffer> {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    const digest = BigInt("0x" + personalDigest(message));
    return crypto.subtle.digest("SHA-256",
      hex.toUint8Array(signWide(digest, this.privKey).slice(2)));
  }
}

export {
  addr,
  MockSigner,
  sign,
  signUnpacked,
  signWide
};

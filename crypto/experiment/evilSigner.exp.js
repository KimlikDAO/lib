import bigints from "../../util/bigints";
import { sha256Uint32 } from "../sha2";
import { sign } from "./evilSigner";

/**
 * @param {{
 *   r: bigint,
 *   digest: Uint8Array
 * }[]} signatures
 * @return {bigint}
 */
const recoverPrivateKey = (signatures) => {
  const SaltedBuff = new Uint8Array(64);
  new TextEncoder().encodeInto("Secret salt 1234abcd", SaltedBuff);

  const bits = Array(256).fill(true);
  for (const { r, digest } of signatures) {
    const revealedIdx = digest[0];
    SaltedBuff.fill(0, 32, bigints.intoBytesBE(SaltedBuff, 64, r));
    bits[revealedIdx] &= sha256Uint32(new Uint32Array(SaltedBuff.buffer))[0] & 1;
  }

  let pk = 0n;
  for (let i = 0; i < 256; ++i) {
    pk *= 2n;
    if (bits[i]) ++pk;
  }

  return pk;
}

const signer = async (privKey) => {
  /** @const {{r: bigint, digest: Uint8Array}[]} */
  const signatures = [];

  // The wallet signs 3000 messages. By the random oracle assumption, the digests are
  // distributed uniformly at random and independently of each other.
  // Assume the signatures are publicly available on a blockchain.
  for (let i = 0; i < 3000; ++i) {
    const digest = /** @type {Uint8Array} */(crypto.getRandomValues(new Uint8Array(32)));
    const { r } = await sign(digest, privKey);
    signatures.push({ r, digest });
  }

  return signatures;
}

const privKey = bigints.fromBytesBE(
    /** @type {Uint8Array} */(crypto.getRandomValues(new Uint8Array(32))));

signer(privKey).then((signatures) => {
  const recoveredPrivKey = recoverPrivateKey(signatures);
  console.log("Signer's private key:\t", privKey.toString(16));
  console.log("Recovered private key:\t", recoveredPrivKey.toString(16));
});

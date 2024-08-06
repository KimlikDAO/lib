/**
 * @fileoverview `did.Section` implementation and manipulation function.
 *
 * @author KimlikDAO
 */

import { signFields } from "../crypto/minaSchnorr";
import { sign } from "../crypto/secp256k1";
import { keccak256, keccak256Uint32, keccak256Uint32ToHex } from "../crypto/sha3";
import evm from "../ethereum/evm";
import {
  base64, base64tenSayıya,
  hexten,
  uint8ArrayeBase64ten, uint8ArrayeHexten
} from "../util/çevir";
import "./section.d";

/** @const {string} */
const KIMLIKDAO_HASH_PREFIX = "\x19KimlikDAO hash\n";

/**
 * @param {string} sectionName
 * @param {!did.Section} section
 * @return {string}
 */
const hash = (sectionName, section) => {
  switch (sectionName) {
    case "exposureReport": {
      /** @const {!did.ExposureReport} */
      const exposureReport = /** @type {!did.ExposureReport} */(section);
      /**
       * The `exposureReport` is hashed in an EVM friendly way.
       * 16 bytes KIMLIKDAO_HASH_PREFIX,
       * 16 bytes signatureTs (big endian),
       * 32 bytes exposureReport.id
       *
       * @const {!Uint8Array} */
      const buff = new Uint8Array(64);
      new TextEncoder().encodeInto(KIMLIKDAO_HASH_PREFIX, buff);
      /** @const {!Uint8Array} */
      const ts = hexten(exposureReport.signatureTs.toString(16));
      buff.set(ts, 32 - ts.length);
      uint8ArrayeHexten(buff.subarray(32), exposureReport.id);
      return keccak256Uint32ToHex(new Uint32Array(buff.buffer));
    }

    case "humanID": {
      /** @const {!did.HumanID} */
      const humanID = /** @type {!did.HumanID} */(section);
      /**
       * The `humanID` is hashed in an EVM friendly way.
       * 16 bytes KIMLIKDAO_HASH_PREFIX,
       * 16 bytes signatureTs (big endian),
       * 32 bytes commitment,
       * 32 bytes humanID.id
       *
       * @const {!Uint8Array} */
      const buff = new Uint8Array(96);
      new TextEncoder().encodeInto(KIMLIKDAO_HASH_PREFIX, buff);
      /** @const {!Uint8Array} */
      const ts = hexten(humanID.signatureTs.toString(16));
      buff.set(ts, 32 - ts.length);
      uint8ArrayeBase64ten(buff.subarray(32), humanID.commitment);
      uint8ArrayeHexten(buff.subarray(64), humanID.id);
      return keccak256Uint32ToHex(new Uint32Array(buff.buffer));
    }
  }
  /** @const {!Set<string>} */
  const notHashed = new Set(["secp256k1", "minaSchnorr", "bls12_381", "commitmentR"]);
  return keccak256(
    KIMLIKDAO_HASH_PREFIX + JSON.stringify(section,
      Object.keys(section).filter((x) => !notHashed.has(x)).sort())
  );
}

/**
 * @param {string} ownerAddress
 * @param {string} commitmentR
 * @return {string} commitment
 */
const commit = (ownerAddress, commitmentR) => {
  const buff = new Uint8Array(32 + 20);
  uint8ArrayeBase64ten(buff, commitmentR);
  for (let /** number */ i = 1; i <= 20; ++i)
    buff[i + 31] = parseInt(ownerAddress.substring(2 * i, 2 * i + 2), 16);
  return base64(new Uint8Array(
    keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32));
}

/**
 * Returns the list of unique signers of an `did.Section`.
 *
 * Note these signers still need to be validated against the `KimlikDAOPassSigners`
 * contract.
 *
 * @param {string} sectionName
 * @param {!did.Section} section
 * @param {string} ownerAddress
 * @return {!Array<string>}
 */
const recoverSectionSigners = (sectionName, section, ownerAddress) => {
  if (sectionName != "exposureReport" && !section.commitment)
    section.commitment = commit(ownerAddress, section.commitmentR);

  /** @const {string} */
  const h = hash(sectionName, section);
  /** @const {!Array<string>} */
  const signers = section.secp256k1.map((signature) =>
    evm.signerAddress(h, signature));
  return [...new Set(signers)];
}

/**
 * @param {string} sectionName
 * @param {!did.Section} section
 * @param {string} commitment
 * @param {number} signatureTs
 * @param {!bigint} privateKey
 */
const signSection = (sectionName, section, commitment, signatureTs, privateKey) => {
  section.commitment = commitment;
  section.signatureTs = signatureTs;
  /** @const {!bigint} */
  const d = BigInt("0x" + hash(sectionName, section));
  let { r, s, yParity } = sign(d, privateKey);
  if (yParity) s += (1n << 255n);
  section.secp256k1 = [evm.uint256(r) + evm.uint256(s)];

  if (sectionName == "humanID") {
    /** @const {!did.HumanID} */
    const humanID = /** @type {!did.HumanID} */(section);
    /**
     * The `humanID` is hashed in an o1js friendly way.
     * [
     *   signatureTs,
     *   commitment,
     *   humanID.id
     * ]
     */
    section.minaSchnorr = [
      signFields([
        BigInt(signatureTs),
        base64tenSayıya(humanID.commitment),
        BigInt("0x" + humanID.id)
      ], privateKey)
    ];
  }
}

export {
  commit,
  hash,
  recoverSectionSigners,
  signSection
};


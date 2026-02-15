import { keccak256, keccak256Uint32ToHex } from "../crypto/sha3";
import base64 from "../util/base64";
import bigints from "../util/bigints";
import hex from "../util/hex";
import { ExposureReport, HumanID, Section } from "./section.d";

/** @const {string} */
const KIMLIKDAO_HASH_PREFIX = "\x19KimlikDAO hash\n";

/**
 * @param {ExposureReport} exposureReport
 * @return {string}
 */
const hashExposureReport = (exposureReport) => {
  /**
   * The `exposureReport` is hashed in an EVM friendly way.
   * 16 bytes KIMLIKDAO_HASH_PREFIX,
   * 16 bytes signatureTs (big endian),
   * 32 bytes exposureReport.id
   *
   * @const {Uint8Array} */
  const buff = new Uint8Array(64);
  new TextEncoder().encodeInto(KIMLIKDAO_HASH_PREFIX, buff);
  bigints.intoBytesBE(buff, 32, exposureReport.signatureTs);
  hex.intoBytes(buff.subarray(32), exposureReport.id);
  return keccak256Uint32ToHex(new Uint32Array(buff.buffer));
};

/**
 * @param {HumanID} humanID
 */
const hashHumanID = (humanID) => {
  /**
   * The `humanID` is hashed in an EVM friendly way.
   * 16 bytes KIMLIKDAO_HASH_PREFIX,
   * 16 bytes signatureTs (big endian),
   * 32 bytes commitment,
   * 32 bytes humanID.id
   *
   * @const {Uint8Array} */
  const buff = new Uint8Array(96);
  new TextEncoder().encodeInto(KIMLIKDAO_HASH_PREFIX, buff);
  bigints.intoBytesBE(buff, 32, humanID.signatureTs);
  base64.intoBytes(buff.subarray(32), humanID.commitment);
  hex.intoBytes(buff.subarray(64), humanID.id);
  return keccak256Uint32ToHex(new Uint32Array(buff.buffer));
};

/** @const {Set<string>} */
const NOT_HASHED = new Set([
  "secp256k1",
  "minaSchnorr",
  "bls12_381",
  "commitmentR",
]);

/**
 * @param {string} sectionName
 * @param {Section} section
 * @return {string}
 */
const hash = (sectionName, section) =>
  sectionName == "exposureReport"
    ? hashExposureReport(/** @type {ExposureReport} */(section))
    : sectionName == "humanID"
      ? hashHumanID(/** @type {HumanID} */(section))
      : keccak256(KIMLIKDAO_HASH_PREFIX + JSON.stringify(
        section,
        Object.keys(section)
          .filter((x) => !NOT_HASHED.has(x))
          .sort()
      ));

export {
  hash,
  hashExposureReport,
  hashHumanID
};

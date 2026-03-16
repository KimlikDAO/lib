import { keccak256, keccak256Uint32ToHex } from "../crypto/sha3";
import base64 from "../util/base64";
import bigints from "../util/bigints";
import hex from "../util/hex";
import { ExposureReport, HumanID, Section } from "./section.d";

const KIMLIKDAO_HASH_PREFIX = "\x19KimlikDAO hash\n";

/** @pure */
const hashExposureReport = (exposureReport: ExposureReport): string => {
  /**
   * The `exposureReport` is hashed in an EVM friendly way.
   * 16 bytes {@link KIMLIKDAO_HASH_PREFIX},
   * 16 bytes {@link Section.signatureTs} (big endian),
   * 32 bytes {@link ExposureReport.id}
   */
  const buff = new Uint8Array(64);
  new TextEncoder().encodeInto(KIMLIKDAO_HASH_PREFIX, buff);
  bigints.intoBytesBE(buff, exposureReport.signatureTs, 32);
  hex.intoBytes(buff.subarray(32), exposureReport.id);
  return keccak256Uint32ToHex(new Uint32Array(buff.buffer));
};

/** @pure */
const hashHumanID = (humanID: HumanID): string => {
  /**
   * The `humanID` is hashed in an EVM friendly way.
   * 16 bytes {@link KIMLIKDAO_HASH_PREFIX},
   * 16 bytes {@link Section.signatureTs} (big endian),
   * 32 bytes {@link Section.commitment},
   * 32 bytes {@link HumanID.id}
   */
  const buff = new Uint8Array(96);
  new TextEncoder().encodeInto(KIMLIKDAO_HASH_PREFIX, buff);
  bigints.intoBytesBE(buff, humanID.signatureTs, 32);
  base64.intoBytes(buff.subarray(32), humanID.commitment as string);
  hex.intoBytes(buff.subarray(64), humanID.id);
  return keccak256Uint32ToHex(new Uint32Array(buff.buffer));
};

const NOT_HASHED: Set<string> = new Set([
  "secp256k1",
  "minaSchnorr",
  "bls12_381",
  "commitmentR",
]);

/** @pure */
const hash = (sectionName: string, section: Section): string => {
  switch (sectionName) {
    case "exposureReport":
      return hashExposureReport(section as ExposureReport);
    case "humanID":
      return hashHumanID(section as HumanID);
    default:
      return keccak256(KIMLIKDAO_HASH_PREFIX +
        JSON.stringify(section, Object.keys(section).filter((x) => !NOT_HASHED.has(x)).sort()));
  }
}

export {
  hash,
  hashExposureReport,
  hashHumanID
};

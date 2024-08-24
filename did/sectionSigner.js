import { ChainGroup } from "../crosschain/chains";
import evm from "../ethereum/evm";
import { signFields, verifyFields } from "../mina/mina";
import { base64tenSayıya } from "../util/çevir";
import { commit } from "./commitment";
import { hash } from "./section";

/**
 * @typedef {{
 *   commitment: string,
 *   commitmentAnon: string,
 *   signatureTs: number,
 *   privateKey: bigint,
 *   privateKeyPallas: bigint
 * }}
 */
const SignParams = {};

/**
 * @param {!did.HumanID} humanID
 */
const signHumanID = (humanID, privateKey) => {
  humanID.minaSchnorr = [signFields([
    BigInt(humanID.signatureTs),
    base64tenSayıya(humanID.commitment),
    BigInt("0x" + humanID.id)
  ], privateKey)];
}

/**
 * @param {!did.HumanID} humanID
 * @return {!Array<string>}
 */
const recoverHumanIDSigners = (humanID, ownerAddress) => {
  if (!humanID.commitment)
    humanID.commitment = commit(ChainGroup.MINA, ownerAddress, humanID.commitmentR);
  /** @const {!Set<string>} */
  const signers = new Set();
  /** @const {!Array<bigint>} */
  const fields = [
    BigInt(humanID.signatureTs),
    base64tenSayıya(humanID.commitment),
    BigInt("0x" + humanID.id)
  ];
  if (!humanID.minaSchnorr) return [];
  for (const sig of humanID.minaSchnorr)
    if (verifyFields(fields, sig)) signers.add(sig.signer);
  return [...signers];
}

/**
 * @param {string} sectionName
 * @param {!did.Section} section
 * @param {SignParams} signParams
 */
const signSection = (sectionName, section, signParams) => {
  section.commitment = sectionName == "humanID"
    ? signParams.commitmentAnon
    : signParams.commitment;
  section.signatureTs = signParams.signatureTs;
  section.secp256k1 = [
    evm.signCompact(hash(sectionName, section), signParams.privateKey)
  ];
  if (sectionName == "humanID")
    signHumanID(/** @type {!did.HumanID} */(section), signParams.privateKeyPallas);
}

/**
 * Returns the list of unique signers of an `did.Section`.
 *
 * Note these signers still need to be validated against the `KimlikDAOPassSigners`
 * contract.
 *
 * @param {string} sectionName
 * @param {!did.Section} section
 * @param {ChainGroup} chainGroup
 * @param {string} ownerAddress
 * @return {!Array<string>}
 */
const recoverSectionSigners = (sectionName, section, chainGroup, ownerAddress) => {
  if (sectionName != "exposureReport" && !section.commitment)
    section.commitment = commit(chainGroup, ownerAddress, section.commitmentR);

  /** @const {string} */
  const h = hash(sectionName, section);
  /** @const {!Array<string>} */
  const signers = section.secp256k1.map((signature) =>
    evm.signerAddress(h, signature));
  return [...new Set(signers)];
}

/**
 * Signs a given `did.DecryptedSections` in-place.
 *
 * @param {did.DecryptedSections} decryptedSections
 * @param {SignParams} signParams
 * @return {did.DecryptedSections}
 */
const signDecryptedSections = (decryptedSections, signParams) => {
  for (const key in decryptedSections)
    signSection(key, decryptedSections[key], signParams);
  return decryptedSections;
}

export {
  SignParams,
  recoverHumanIDSigners,
  recoverSectionSigners,
  signDecryptedSections,
  signSection
};

import { ChainGroup } from "../crosschain/chains";
import { sign, signerAddress } from "../ethereum/signer";
import { signFields, verifyFields } from "../mina/signer";
import base64 from "../util/base64";
import { commit } from "./commitment";
import { hash } from "./section";
import { DecryptedSections, HumanID, Section } from "./section.d";

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
 * @param {HumanID} humanID
 * @param {bigint} privateKey
 * @return {void}
 */
const signHumanID = (humanID, privateKey) => {
  humanID.minaSchnorr = [signFields([
    BigInt(humanID.signatureTs),
    base64.toBigInt(humanID.commitment),
    BigInt("0x" + humanID.id)
  ], privateKey)];
}

/**
 * @param {HumanID} humanID
 * @param {string} ownerAddress
 * @return {string[]}
 */
const recoverHumanIDSigners = (humanID, ownerAddress) => {
  if (!humanID.commitment)
    humanID.commitment = commit(ChainGroup.MINA, ownerAddress, humanID.commitmentR);
  /** @const {Set<string>} */
  const signers = new Set();
  /** @const {bigint[]} */
  const fields = [
    BigInt(humanID.signatureTs),
    base64.toBigInt(humanID.commitment),
    BigInt("0x" + humanID.id)
  ];
  if (!humanID.minaSchnorr) return [];
  for (const sig of humanID.minaSchnorr)
    if (verifyFields(fields, sig)) signers.add(sig.signer);
  return [...signers];
}

/**
 * @param {string} sectionName
 * @param {Section} section
 * @param {SignParams} signParams
 */
const signSection = (sectionName, section, signParams) => {
  section.commitment = sectionName == "humanID"
    ? signParams.commitmentAnon
    : signParams.commitment;
  section.signatureTs = signParams.signatureTs;
  section.secp256k1 = [
    sign(hash(sectionName, section), signParams.privateKey)
  ];
  if (sectionName == "humanID")
    signHumanID(/** @type {HumanID} */(section), signParams.privateKeyPallas);
}

/**
 * Returns the list of unique signers of an `Section`.
 *
 * Note these signers still need to be validated against the `KimlikDAOPassSigners`
 * contract.
 *
 * @param {string} sectionName
 * @param {Section} section
 * @param {ChainGroup} chainGroup
 * @param {string} ownerAddress
 * @return {string[]}
 */
const recoverSectionSigners = (sectionName, section, chainGroup, ownerAddress) => {
  if (sectionName != "exposureReport" && !section.commitment)
    section.commitment = commit(chainGroup, ownerAddress, section.commitmentR);

  /** @const {string} */
  const h = hash(sectionName, section);
  /** @const {string[]} */
  const signers = section.secp256k1.map((signature) => signerAddress(h, signature));
  return [...new Set(signers)];
}

/**
 * Signs a given `DecryptedSections` in-place.
 *
 * @param {DecryptedSections} decryptedSections
 * @param {SignParams} signParams
 * @return {DecryptedSections}
 */
const signDecryptedSections = (decryptedSections, signParams) => {
  for (const key in decryptedSections)
    signSection(key, decryptedSections[key], signParams);
  return decryptedSections;
}

export {
  recoverHumanIDSigners,
  recoverSectionSigners,
  signDecryptedSections,
  SignParams,
  signSection
};

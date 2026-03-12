import { ChainGroup } from "../crosschain/chains";
import { sign, signerAddress } from "../ethereum/signer";
import { signFields, verifyFields } from "../mina/signer";
import base64 from "../util/base64";
import { commit } from "./commitment";
import { hash } from "./section";
import { DecryptedSections, HumanID, Section } from "./section.d";

type SignParams = {
  commitment: string;
  commitmentAnon: string;
  signatureTs: number;
  privateKey: bigint;
  privateKeyPallas: bigint;
};

const signHumanID = (humanID: HumanID, privateKey: bigint): void => {
  humanID.minaSchnorr = [
    signFields([
      BigInt(humanID.signatureTs),
      base64.toBigInt(humanID.commitment as string),
      BigInt("0x" + humanID.id)
    ], privateKey)
  ];
}

const recoverHumanIDSigners = (humanID: HumanID, ownerAddress: string): string[] => {
  if (!humanID.commitment)
    humanID.commitment = commit(ChainGroup.MINA, ownerAddress, humanID.commitmentR);
  const signers: Set<string> = new Set();
  const fields: readonly bigint[] = [
    BigInt(humanID.signatureTs),
    base64.toBigInt(humanID.commitment),
    BigInt("0x" + humanID.id)
  ];
  if (!humanID.minaSchnorr) return [];
  for (const sig of humanID.minaSchnorr)
    if (verifyFields(fields, sig)) signers.add(sig.signer);
  return [...signers];
}

const signSection = (
  sectionName: string,
  section: Section,
  signParams: SignParams
): void => {
  section.commitment = sectionName == "humanID"
    ? signParams.commitmentAnon
    : signParams.commitment;
  section.signatureTs = signParams.signatureTs;
  section.secp256k1 = [
    sign(hash(sectionName, section), signParams.privateKey)
  ];
  if (sectionName == "humanID")
    signHumanID(section as HumanID, signParams.privateKeyPallas);
}

/**
 * Returns the list of unique signers of a `Section`.
 *
 * Note these signers still need to be validated against the on-chain signers
 * registry.
 */
const recoverSectionSigners = (
  sectionName: string,
  section: Section,
  chainGroup: ChainGroup,
  ownerAddress: string
): string[] => {
  if (sectionName != "exposureReport" && !section.commitment)
    section.commitment = commit(chainGroup, ownerAddress, section.commitmentR);

  const h = hash(sectionName, section);
  const signers: readonly string[] = section.secp256k1
    .map((signature) => signerAddress(h, signature));
  return [...new Set(signers)];
}

/**
 * Signs a given `DecryptedSections` in-place.
 */
const signDecryptedSections = (
  decryptedSections: DecryptedSections,
  signParams: SignParams
): DecryptedSections => {
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

/**
 * @fileoverview KimlikDAO decentralized identifier definitions.
 *
 * @author KimlikDAO
 */

import { SignerSignature } from "../mina/signature.d";
import { AdresBilgileri, KutukBilgileri } from "../protocol/nko/nvi.d";
import { VerifiableID } from "./verifiableID.d";

/**
 * A signed section of user data (e.g., geo address, contact info).
 * Each signature contains a timestamp and a wallet commitment; therefore
 * each section of data is signed *for* a walet and *at* a certain time.
 *
 * One exception to this is the {@link ExposureReport}, which is not
 * committed to a wallet (but still contains a signature timestamp), since it
 * is used in cases where the user has lost their keys.
 *
 */
interface Section {
  signatureTs: number;

  commitment?: string;
  /**
   * The blinding factor for the wallet commitment.
   *
   * This piece of data is never sent to the signer nodes so that the signers
   * can never associate a person info to a wallet address.
   */
  commitmentR: string;

  /**
   * The aggregated bls12-381 signature from various signer nodes.
   */
  readonly bls12_381: string;

  /**
   * The secp256k1 signatures kept as a list of 64 bytes compact signatures,
   * sorted in lex order.
   *
   * Each signature must be from a different (valid) signer node.
   *
   */
  secp256k1: string[];

  minaSchnorr: SignerSignature[];
}

interface HumanID extends Section, VerifiableID { }

interface ExposureReport extends Section, VerifiableID { }


/**
 * Contains the fundamental identification data of a person such as
 * name, date of birth, national id etc.
 */
interface PersonInfo extends Section {
  readonly first: string;
  readonly last: string;
  readonly localIdNumber: string;
  readonly dateOfBirth: string;
  readonly cityOfBirth: string;
  readonly gender: string;
  /**
   * A length 64 hex string, encoding the 32-bytes exposureReportID.
   *
   * When a DID holder gets their wallet private keys exposed, they can either
   * revoke the DID themselves, or use social revoking.
   *
   * If they are unable to do either (because they lost their private keys and
   * did not set up social revoke), they need to get a new DID and file an
   * exposure report at https://kimlikdao.org/report using the new DID.
   *
   * The report is filed in a completely decentralized fashion by sending an
   * appropriate transaction containing the signed `exposureReportID`, which
   * every KimlikDAO DID comes with. If desired, this can be done by interacting
   * with the contract directly and the above interface is merely a convenience.
   *
   * The `exposureReportID` is obtained from the `localIdNumber` via a verifiable
   * delay function, therefore for maximum privacy, one may choose to discard an
   * EVM address used for an `exposureReport`.
   */
  readonly exposureReportID: string;
}

interface ContactInfo extends Section {
  readonly email: string;
  readonly phone: string;
}

interface AddressInfo extends Section {
  readonly country: string;
}

interface TurkishAddressInfo extends AddressInfo, AdresBilgileri { }

interface KütükBilgileri extends Section, KutukBilgileri { }

/**
 * A collection of `Section`s keyed by a string name.
 */
type DecryptedSections = Record<string, Section>;

export {
  AddressInfo,
  ContactInfo,
  DecryptedSections,
  ExposureReport,
  HumanID,
  KütükBilgileri,
  PersonInfo,
  Section,
  TurkishAddressInfo
};

/**
 * @fileoverview KimlikDAO decentralized identifier definitions.
 *
 * @author KimlikDAO
 * @externs
 */

import did from "./did.d";
import "./verifiableID.d";

/**
 * A signed section of user data (e.g., geo address, contact info).
 * Each signature contains a timestamp and a wallet commitment; therefore
 * each section of data is signed *for* a walet and *at* a certain time.
 *
 * One exception to this is the `exposureReportID`, which is not committed
 * to a wallet (but still contains a signature timestamp), since it is used in
 * cases where the user has lost their keys.
 *
 * @interface
 * @struct
 */
did.Section = function () { }

/** @type {number} */
did.Section.prototype.signatureTs;

/** @type {string} */
did.Section.prototype.commitment;

/**
 * The blinding factor for the wallet commitment.
 *
 * This piece of data is never sent to the signer nodes so that the signers
 * can never associate a person info to a wallet address.
 *
 * @type {string}
 */
did.Section.prototype.commitmentR;

/**
 * The aggregated bls12-381 signature from various signer nodes.
 *
 * @type {string}
 */
did.Section.prototype.bls12_381;

/**
 * The secp256k1 signatures kept as a list of 64 bytes compact signatures,
 * sorted in lex order.
 *
 * Each signature must be from a different (valid) signer node.
 *
 * @type {Array<string>}
 */
did.Section.prototype.secp256k1;

/**
 * The Schnorr signatures kept as a list of 64 bytes compact signatures,
 * sorted in lex order.
 * 
 * Each signature must be from a different (valid) signer node.
 * 
 * @type {Array<string>}
 */
did.Section.prototype.minaSchnorr;

/**
 * Contains the fundamental identification data of a person such as
 * name, date of birth, national id etc.
 *
 * @interface
 * @struct
 *
 * @extends {did.Section}
 */
did.PersonInfo = function () { };

/** @type {string} */
did.PersonInfo.prototype.first;

/** @type {string} */
did.PersonInfo.prototype.last;

/** @type {string} */
did.PersonInfo.prototype.localIdNumber;

/** @type {string} */
did.PersonInfo.prototype.dateOfBirth;

/** @type {string} */
did.PersonInfo.prototype.cityOfBirth;

/** @type {string} */
did.PersonInfo.prototype.gender;

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
 *
 * @type {string}
 */
did.PersonInfo.prototype.exposureReportID;

/**
 * An info section containing verified contact info for a person / entity.
 *
 * @interface
 * @struct
 *
 * @extends {did.Section}
 */
did.ContactInfo = function () { }

/** @type {string} */
did.ContactInfo.prototype.email;

/** @type {string} */
did.ContactInfo.prototype.phone;

/**
 * @interface
 * @struct
 *
 * @extends {did.Section}
 */
did.AddressInfo = function () { }

/**
 * @type {string}
 */
did.AddressInfo.prototype.country;

/**
 * @interface
 * @struct
 *
 * @extends {did.Section}
 * @extends {did.VerifiableID}
 */
did.ExposureReport = function () { }

/**
 * @interface
 * @struct
 *
 * @extends {did.Section}
 * @extends {did.VerifiableID}
 */
did.HumanID = function () { }

import "../node/nvi.d";

/**
 * @interface
 * @extends {did.AddressInfo}
 * @extends {node.nvi.AdresBilgileri}
 */
did.TürkiyeAdresi = function () { }

/**
 * Kişinin kütük bilgilerini içerir bilgi kartı.
 *
 * @interface
 * @extends {did.Section}
 * @extends {node.nvi.KutukBilgileri}
 */
did.KütükBilgileri = function () { }

/**
 * @interface
 * @extends {did.Section}
 */
did.SoyZinciri = function () { }

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.anneSymmetricKey;

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.annePrivateKey;

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.babaSymmetricKey;

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.babaPrivateKey;

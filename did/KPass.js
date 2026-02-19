import { Signer } from "../crosschain/signer";
import { decrypt, encrypt } from "../crosschain/unlockable";
import { Unlockable } from "../crosschain/unlockable.d";
import { ERC721MetaData, ERC721Unlockable } from "../ethereum/contract/ERC721.d";
import { wait } from "../util/promises";
import { hash } from "./section";
import { DecryptedSections, PersonInfo, Section } from "./section.d";
import { verify } from "./verifiableID";
import { VerifiableID } from "./verifiableID.d";

/**
 * Given an array of `EncryptedSections` keys, determines a minimal set of
 * `EncryptedSections` keys which, when unlocked, would cover all the
 * desired `Section`'s.
 *
 * The selected unlockables are returned as an array of values from the
 * `encryptedSectionKeys` array.
 *
 * @param {string[]} encryptedSectionsKeys
 * @param {string[]} sectionKeys
 * @return {string[]} unlockable keys which together have all the desired
 *                    `Section`s.
 */
const selectEncryptedSections = (encryptedSectionsKeys, sectionKeys) => {
  // If there is a solution with 1 or 2 unlockables, we'll find the optimal
  // solution using exhaustive search, which takes O(n^2) time where
  // `n = |nft.unlockables|`. Otherwise, we'll resort to a greedy approach.
  /** @const {Set<string>} */
  const sks = new Set(sectionKeys);

  /**
   * @const {{
   *   key: string,
   *   inc: Set<string>,
   *   exc: Set<string>
   * }[]}
   */
  const arr = [];
  {
    /** @type {number} */
    let bestI = -1;
    /** @type {number} */
    let bestExc = 1e9;
    for (const key of encryptedSectionsKeys) {
      /** @const {string[]} */
      const sections = key.split(",");
      /** @const {Set<string>} */
      const inc = new Set(sections.filter((e) => sks.has(e)));
      /** @const {Set<string>} */
      const exc = new Set(sections.filter((e) => !sks.has(e)));
      if (inc.size == sks.size && exc.size < bestExc) {
        bestI = arr.length;
        bestExc = exc.size;
      }
      arr.push({ key, inc, exc });
    }
    // There is a solution with 1 unlockable.
    if (bestI >= 0)
      return [arr[bestI].key];
  }

  /**
   * Calculates 100 * |A \cup B| + |A| + |B|.
   *
   * @param {Set<string>} A
   * @param {Set<string>} B
   * @return {number}
   */
  const score = (A, B) => {
    /** @type {number} */
    let count = 101 * (A.size + B.size);
    for (const b of B)
      count -= +A.has(b) * 100;
    return count;
  }

  /** @const {number} */
  const n = arr.length;
  /** @type {number} */
  let bestI = -1;
  /** @type {number} */
  let bestJ = -1;
  /** @type {number} */
  let bestExc = 1e9;
  for (let i = 0; i < n; ++i)
    for (let j = i + 1; j < n; ++j)
      if (sectionKeys.every((x) => arr[i].inc.has(x) || arr[j].inc.has(x))) {
        const exc = score(arr[i].exc, arr[j].exc);
        if (exc < bestExc) {
          bestI = i;
          bestJ = j;
          bestExc = exc;
        }
      }
  // There is a solution with 2 unlockables.
  if (bestI >= 0)
    return [arr[bestI].key, arr[bestJ].key];

  // Since there are no solutions with 1 or 2 unlockables, we'll resort to a
  // greedy algorithm.
  arr.sort((a, b) => (b.inc.size - b.exc.size) - (a.inc.size - a.exc.size));
  /** @const {string[]} */
  const res = [];
  for (const entry of arr) {
    if (!sks.size) break;
    /** @type {boolean} */
    let helpful = false;
    for (const elm of entry.inc)
      helpful ||= sks.delete(elm);
    if (helpful)
      res.push(entry.key);
  }
  return res;
}

/**
 * @param {ERC721Unlockable} nft
 * @param {string[]} sectionNames
 * @param {Signer} signer
 * @param {string} address
 * @return {Promise<DecryptedSections>}
 */
const fromUnlockableNFT = async (nft, sectionNames, signer, address) => {
  /** @const {string[]} */
  const encryptedSectionsKeys = selectEncryptedSections(
    Object.keys(nft.unlockables),
    sectionNames
  );

  /** @const {DecryptedSections} */
  const decryptedSections = {};

  for (let i = 0; i < encryptedSectionsKeys.length; ++i) {
    if (i > 0)
      await wait(100);
    /** @type {Unlockable} */
    const encryptedSections = /** @type {Unlockable} */(
      nft.unlockables[encryptedSectionsKeys[i]]);
    /** @const {string | null} */
    const decryptedText = await decrypt(encryptedSections, signer, address);
    if (decryptedText)
      Object.assign(decryptedSections,
          /** @type {DecryptedSections} */(JSON.parse(decryptedText)));
  }
  /** @const {Set<string>} */
  const sectionNamesSet = new Set(sectionNames);
  for (const section in decryptedSections)
    if (!sectionNamesSet.has(section)) delete decryptedSections[section];
  return decryptedSections;
}

/**
 * Verifies the `VerifiableID`'s and removes the ones that fail to verify.
 * Further, strips the proofs from those that were succesfully verified.
 *
 * @param {DecryptedSections} decryptedSections
 * @param {Record<string, string>} verifyKeys
 * @return {Promise<DecryptedSections>}
 */
const checkVerifiableIDs = (decryptedSections, verifyKeys) => {
  /** @const {string} */
  const localIdNumber = /** @type {PersonInfo} */(
    decryptedSections["personInfo"]).localIdNumber;

  /**
   * @param {string} name
   * @return {Promise<void>}
   */
  const verifySingle = (name) => {
    /** @const {VerifiableID} */
    const verifiableID = /** @type {VerifiableID} */(decryptedSections[name]);
    return verifiableID
      ? verify(verifiableID, localIdNumber, verifyKeys[name])
        .then((isValid) => {
          if (isValid) {
            delete verifiableID.wesolowskiL;
            delete verifiableID.wesolowskiP;
            delete verifiableID.x;
          } else
            delete decryptedSections[name];
        })
      : Promise.resolve();
  }
  return Promise.all([verifySingle("exposureReport"), verifySingle("humanID")])
    .then(() => decryptedSections);
}

/**
 * @typedef {{
 *   userPrompt: string,
 *   sectionNames: string[]
 * }}
 */
const SectionGroup = {};

/**
 * @param {ERC721MetaData} metadata
 * @param {DecryptedSections} decryptedSections
 * @param {SectionGroup[]} sectionGroups
 * @param {Signer} signer
 * @param {string} address
 * @return {Promise<ERC721Unlockable>}
 */
const toUnlockableNFT = async (metadata, decryptedSections, sectionGroups, signer, address) => {
  /** @const {Record<string, Unlockable>} */
  const unlockables = {};
  for (let i = 0; i < sectionGroups.length; ++i) {
    /** @const {Promise<void>} */
    const duraklatıcı = wait(2000);
    /** @const {DecryptedSections} */
    const sections = {};
    for (const /** @type {string} */ name of sectionGroups[i].sectionNames)
      sections[name] = decryptedSections[name];
    /** @const {string} */
    const unlockableKey = sectionGroups[i].sectionNames.sort().join(",");
    unlockables[unlockableKey] = await encrypt(JSON.stringify(sections),
      sectionGroups[i].userPrompt,
      "promptsign-sha256-aes-ctr",
      signer,
      address
    );
    if (i < sectionGroups.length - 1)
      await duraklatıcı;
  }
  return /** @type {ERC721Unlockable} */({
    ...metadata,
    unlockables
  });
}

/**
 * @param {DecryptedSections[]} decryptedSectionsList
 * @param {string} commitmentR
 * @param {string} commitmentAnonR
 * @param {number} signerCountNeeded
 * @return {DecryptedSections}
 */
const combineMultiple = (
  decryptedSectionsList,
  commitmentR,
  commitmentAnonR,
  signerCountNeeded
) => {
  /** @const {DecryptedSections} */
  const combined = {};
  if (decryptedSectionsList.length < signerCountNeeded)
    return combined;

  /** @const {Set<string>} */
  const sectionNames = new Set();

  for (const decryptedSections of decryptedSectionsList)
    for (const key in decryptedSections)
      sectionNames.add(key);

  for (const key of sectionNames) {
    /** @const {Record<string, Section[]>} */
    const hashToSections = {};
    for (const decryptedSections of decryptedSectionsList)
      if (key in decryptedSections
        && decryptedSections[key].secp256k1
        && decryptedSections[key].secp256k1.length) {
        const h = hash(key, decryptedSections[key]);
        (hashToSections[h] ||= []).push(decryptedSections[key]);
      }
    /**
     * Find the most frequent hash group.
     *
     * @type {Section[]}
     */
    let mostFreq = []
    for (const h in hashToSections)
      if (hashToSections[h].length > mostFreq.length)
        mostFreq = hashToSections[h];
    if (mostFreq.length >= signerCountNeeded) {
      combined[key] = mostFreq[0];
      combined[key].commitmentR = key == "humanID"
        ? commitmentAnonR : commitmentR;
      delete combined[key].commitment;
      for (let i = 1; i < mostFreq.length; ++i)
        combined[key].secp256k1.push(
          .../** @type {string[]} */(mostFreq[i].secp256k1));

      if (combined[key].minaSchnorr)
        for (let i = 1; i < mostFreq.length; ++i)
          combined[key].minaSchnorr.push(...(mostFreq[i].minaSchnorr || []));
    }
  }
  return combined;
}

export {
  checkVerifiableIDs,
  combineMultiple,
  fromUnlockableNFT,
  SectionGroup,
  selectEncryptedSections,
  toUnlockableNFT
};

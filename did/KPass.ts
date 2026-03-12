import { Signer } from "../crosschain/signer";
import { decrypt, encrypt } from "../crosschain/unlockable";
import { Unlockable } from "../crosschain/unlockable.d";
import { ERC721MetaData, ERC721Unlockable } from "../ethereum/contract/ERC721.d";
import { wait } from "../util/promises";
import { hash } from "./section";
import { DecryptedSections, PersonInfo, Section } from "./section.d";
import { verify } from "./verifiableID";
import { VerifiableID } from "./verifiableID.d";
import { partition } from "../util/arrays";

/**
 * Given an array of `EncryptedSections` keys, determines a minimal set of
 * `EncryptedSections` keys which, when unlocked, would cover all the
 * desired `Section`'s.
 *
 * The selected unlockables are returned as an array of values from the
 * `encryptedSectionKeys` array.
 *
 * Since this is an instance of Set Cover problem, the general solution is
 * difficult to find. We find the optimal solution if the `sectionKeys` can
 * be covered by 1 or 2 unlockables. Otherwise, we resort to a greedy approach.
 */
const selectEncryptedSections = (
  encryptedSectionsKeys: string[],
  sectionKeys: string[]
): string[] => {
  // If there is a solution with 1 or 2 unlockables, we'll find the optimal
  // solution using exhaustive search, which takes O(n^2) time where
  // `n = |nft.unlockables|`. Otherwise, we'll resort to a greedy approach.
  const sks: Set<string> = new Set(sectionKeys);
  const arr: { key: string, inc: Set<string>, exc: Set<string> }[] = [];
  {
    let bestI = -1;
    let bestExc = 1e9;
    for (const key of encryptedSectionsKeys) {
      const incExc = partition(key.split(","), (e) => sks.has(e));
      const inc: Set<string> = new Set(incExc[0]);
      const exc: Set<string> = new Set(incExc[1]);
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
   */
  const score = (A: Set<string>, B: Set<string>): number => {
    let count = 101 * (A.size + B.size);
    for (const b of B)
      count -= +A.has(b) * 100;
    return count;
  }
  const n = arr.length;
  let bestI = -1;
  let bestJ = -1;
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
  const res: string[] = [];
  for (const entry of arr) {
    if (!sks.size) break;
    let helpful = false;
    for (const elm of entry.inc)
      helpful ||= sks.delete(elm);
    if (helpful)
      res.push(entry.key);
  }
  return res;
}

const fromUnlockableNFT = async (
  nft: ERC721Unlockable,
  sectionNames: string[],
  signer: Signer,
  address: string
): Promise<DecryptedSections> => {
  const encryptedSectionsKeys = selectEncryptedSections(
    Object.keys(nft.unlockables),
    sectionNames
  );
  const decryptedSections: DecryptedSections = {};

  for (let i = 0; i < encryptedSectionsKeys.length; ++i) {
    if (i > 0)
      await wait(100);
    const encryptedSections = nft.unlockables[encryptedSectionsKeys[i]] as Unlockable;
    const decryptedText: string | null = await decrypt(encryptedSections, signer, address);
    if (decryptedText)
      Object.assign(decryptedSections,
        JSON.parse(decryptedText) as DecryptedSections
      );
  }
  const sectionNamesSet: Set<string> = new Set(sectionNames);
  for (const section in decryptedSections)
    if (!sectionNamesSet.has(section)) delete decryptedSections[section];
  return decryptedSections;
}

/**
 * Verifies the `VerifiableID`'s and removes the ones that fail to verify.
 * Further, strips the proofs from those that were succesfully verified.
 */
const checkVerifiableIDs = (
  decryptedSections: DecryptedSections,
  verifyKeys: Record<string, string>
): Promise<DecryptedSections> => {
  const localIdNumber = (decryptedSections["personInfo"] as PersonInfo).localIdNumber;

  const verifySingle = (name: string): Promise<void> => {
    const verifiableID = decryptedSections[name] as unknown as VerifiableID;
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

type SectionGroup = {
  userPrompt: string,
  sectionNames: string[]
}

const toUnlockableNFT = async (
  metadata: ERC721MetaData,
  decryptedSections: DecryptedSections,
  sectionGroups: SectionGroup[],
  signer: Signer,
  address: string
): Promise<ERC721Unlockable> => {
  const unlockables: Record<string, Unlockable> = {};
  for (let i = 0; i < sectionGroups.length; ++i) {
    const waiter = wait(2000);
    const sections: DecryptedSections = {};
    for (const name of sectionGroups[i].sectionNames)
      sections[name] = decryptedSections[name];
    const unlockableKey = sectionGroups[i].sectionNames.sort().join(",");
    unlockables[unlockableKey] = await encrypt(JSON.stringify(sections),
      sectionGroups[i].userPrompt,
      "promptsign-sha256-aes-ctr",
      signer,
      address
    );
    if (i < sectionGroups.length - 1)
      await waiter;
  }
  return { ...metadata, unlockables } as ERC721Unlockable;
}

const combineMultiple = (
  decryptedSectionsList: DecryptedSections[],
  commitmentR: string,
  commitmentAnonR: string,
  signerCountNeeded: number
): DecryptedSections => {
  const combined: DecryptedSections = {};
  if (decryptedSectionsList.length < signerCountNeeded)
    return combined;

  const sectionNames: Set<string> = new Set();

  for (const decryptedSections of decryptedSectionsList)
    for (const key in decryptedSections)
      sectionNames.add(key);

  for (const key of sectionNames) {
    const hashToSections: Record<string, Section[]> = {};
    for (const decryptedSections of decryptedSectionsList)
      if (key in decryptedSections
        && decryptedSections[key].secp256k1
        && decryptedSections[key].secp256k1.length) {
        const h = hash(key, decryptedSections[key]);
        (hashToSections[h] ||= []).push(decryptedSections[key]);
      }
    // Find the most frequent hash group.
    let mostFreq: Section[] = [];
    for (const h in hashToSections)
      if (hashToSections[h].length > mostFreq.length)
        mostFreq = hashToSections[h];
    if (mostFreq.length >= signerCountNeeded) {
      combined[key] = mostFreq[0];
      combined[key].commitmentR = key == "humanID"
        ? commitmentAnonR : commitmentR;
      delete combined[key].commitment;
      for (let i = 1; i < mostFreq.length; ++i)
        combined[key].secp256k1.push(...mostFreq[i].secp256k1);

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

import { describe, expect, test } from "bun:test";
import { MockSigner } from "../../crosschain/mock/signer";
import { Signer } from "../../crosschain/signer";
import { keccak256Uint8 } from "../../crypto/sha3";
import vm from "../../testing/vm";
import { base64 } from "../../util/çevir";
import {
  SectionGroup,
  combineMultiple,
  fromUnlockableNFT,
  selectEncryptedSections,
  sign,
  toUnlockableNFT
} from "../decryptedSections";
import { commit, recoverSectionSigners } from "../section";

describe("Selected encrypted section tests", () => {
  /** @const {!Array<string>} */
  const encryptedSectionsKeys = [
    "a",
    "a,b",
    "a,b,c",
    "a,b,c,d",
    "b,c,d",
    "c,d",
    "c,d,e",
    "A,B,C,E,F,G",
    "A,B,D,E,F,G",
    "A,C,D,X,Y",
    "B,C,D,Z,T",
    "1,2,u",
    "1,3,u,v",
    "1,4,u,v,s",
  ];

  /**
   * @param {!Array<string>} sections
   * @param {!Array<string>} expected
   */
  const check = (sections, expected) => {
    /** @const {!Array<string>} */
    const selected = selectEncryptedSections(encryptedSectionsKeys, sections);
    /** @const {!Set<string>} */
    const expectSet = new Set(expected);
    /** @const {boolean} */
    const equal = selected.length == expectSet.size && selected.every((x) => expectSet.has(x));
    expect(equal).toBeTrue();
  }

  test("simple cases", () => {
    check(["a"], ["a"]);
    check(["b"], ["a,b"]);
    check(["c"], ["c,d"]);
    check(["d"], ["c,d"]);
    check(["e"], ["c,d,e"]);
    check(["a", "b"], ["a,b"]);
    check(["a", "c"], ["a,b,c"]);
    check(["a", "b", "d"], ["a,b,c,d"]);
  });

  test("two unlockables", () => {
    check(["a", "e"], ["a", "c,d,e"]);
    check(["b", "e"], ["b,c,d", "c,d,e"]);
    check(["a", "b", "e"], ["a,b", "c,d,e"]);

    check(["A", "B", "C", "D"], ["A,B,C,E,F,G", "A,B,D,E,F,G"])
  });

  test("greedy solver", () => {
    check(["1", "2", "3", "4"], ["1,2,u", "1,3,u,v", "1,4,u,v,s"]);
    check(["a", "e", "1", "2"], ["a", "c,d,e", "1,2,u"]);
    check(["a", "e", "1", "2", "4"], ["a", "c,d,e", "1,2,u", "1,4,u,v,s"]);
  });
});

describe("Combinig multiple DIDs", () => {
  test("combined KPass has all signatures", () => {
    /** @const {!TextEncoder} */
    const encoder = new TextEncoder();
    /** @const {string} */
    const ownerAddress = vm.addr(1n);

    /** @const {string} */
    const commitmentR = base64(keccak256Uint8(encoder.encode("commitmentR")));
    /** @const {string} */
    const commitmentAnonR = base64(keccak256Uint8(encoder.encode("commitmentAnonR")));

    /** @const {string} */
    const commitment = commit(ownerAddress, commitmentR);
    /** @const {string} */
    const commitmentAnon = commit(ownerAddress, commitmentAnonR);

    /** @const {!did.DecryptedSections} */
    const kpass = {
      "humanID": /** @type {!did.HumanID} */({
        id: "9e10e195f5c4fb987af3077fe241ff7108d39ed7a3b2908da6a37778ad75ee39",
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Kaan",
        last: "Ankara",
      })
    };

    /** @const {!Array<did.DecryptedSections>} */
    const kpasses = Array(5);

    for (let i = 0; i < kpasses.length; ++i) {
      kpasses[i] = /** @type {!did.DecryptedSections} */(structuredClone(kpass));
      sign(kpasses[i], commitment, commitmentAnon, 1337, BigInt(i + 10));
    }

    /** @const {!did.DecryptedSections} */
    const combined = combineMultiple(kpasses, commitmentR, commitmentAnonR, 5);

    expect(Object.keys(combined).length).toBe(Object.keys(kpass).length);

    expect(combined["humanID"].secp256k1.length).toBe(5);
    expect(combined["personInfo"].secp256k1.length).toBe(5);
    expect(combined["humanID"].commitmentR).toBe(commitmentAnonR);
    expect(combined["personInfo"].commitmentR).toBe(commitmentR);
    /** @const {!Array<string>} */
    const signers = [vm.addr(10n), vm.addr(11n), vm.addr(12n), vm.addr(13n), vm.addr(14n)];
    expect(recoverSectionSigners("humanID", combined["humanID"], ownerAddress))
      .toEqual(signers);
    expect(recoverSectionSigners("personInfo", combined["personInfo"], ownerAddress))
      .toEqual(signers);
    expect(combined["humanID"].commitment).toBe(commitmentAnon);
    expect(combined["personInfo"].commitment).toBe(commitment);
  });

  test("combine multiple conflicting KPass'es", () => {
    /** @const {!TextEncoder} */
    const encoder = new TextEncoder();
    /** @const {string} */
    const ownerAddress = vm.addr(1n);

    /** @const {string} */
    const commitmentR = base64(keccak256Uint8(encoder.encode("commitmentR")));
    /** @const {string} */
    const commitmentAnonR = base64(keccak256Uint8(encoder.encode("commitmentAnonR")));

    /** @const {string} */
    const commitment = commit(ownerAddress, commitmentR);
    /** @const {string} */
    const commitmentAnon = commit(ownerAddress, commitmentAnonR);

    /** @const {!did.DecryptedSections} */
    const kpass1 = {
      "humanID": /** @type {!did.HumanID} */({
        id: "9e10e195f5c4fb987af3077fe241ff7108d39ed7a3b2908da6a37778ad75ee39",
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Kaan",
        last: "Ankara",
      })
    };

    /** @const {!did.DecryptedSections} */
    const kpass2 = {
      "humanID": /** @type {!did.HumanID} */({
        id: "793ae065c561c060048762a8a9112f0645574f76a9179169cf446147564ff373",
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Kaan",
        last: "Ankara",
      })
    };

    /** @const {!Array<did.DecryptedSections>} */
    const kpasses = Array(5);

    for (let i = 0; i < kpasses.length; ++i) {
      kpasses[i] = /** @type {!did.DecryptedSections} */(i < 2
        ? structuredClone(kpass1) : structuredClone(kpass2));
      sign(kpasses[i], commitment, commitmentAnon, 1337, BigInt(i + 10));
    }

    /** @const {!did.DecryptedSections} */
    const combined = combineMultiple(kpasses, commitmentR, commitmentAnonR, 3);
    expect(combined["personInfo"].secp256k1.length).toBe(5);
    expect(combined["humanID"].secp256k1.length).toBe(3);

    expect(recoverSectionSigners("humanID", combined["humanID"], ownerAddress))
      .toEqual([vm.addr(12n), vm.addr(13n), vm.addr(14n)]);
    expect(recoverSectionSigners("personInfo", combined["personInfo"], ownerAddress))
      .toEqual([vm.addr(10n), vm.addr(11n), vm.addr(12n), vm.addr(13n), vm.addr(14n)]);
  });

  test("combine multiple with below-threshold signatures", () => {
    /** @const {!TextEncoder} */
    const encoder = new TextEncoder();
    /** @const {string} */
    const ownerAddress = vm.addr(1n);

    /** @const {string} */
    const commitmentR = base64(keccak256Uint8(encoder.encode("commitmentR")));
    /** @const {string} */
    const commitmentAnonR = base64(keccak256Uint8(encoder.encode("commitmentAnonR")));

    /** @const {string} */
    const commitment = commit(ownerAddress, commitmentR);
    /** @const {string} */
    const commitmentAnon = commit(ownerAddress, commitmentAnonR);

    /** @const {!Array<!did.DecryptedSections>} */
    const kpass = [{
      "humanID": /** @type {!did.HumanID} */({
        id: "9e10e195f5c4fb987af3077fe241ff7108d39ed7a3b2908da6a37778ad75ee39",
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Kaan",
        last: "Ankara",
      })
    }, {
      "humanID": /** @type {!did.HumanID} */({
        id: "793ae065c561c060048762a8a9112f0645574f76a9179169cf446147564ff373",
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Kaan",
        last: "Ankara",
      })
    }, {
      "humanID": /** @type {!did.HumanID} */({
        id: "9d370663d573b5c6ada65204a460c4464c0a390d7b1310a92be773731a07e821",
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Kaan",
        last: "Ankara",
      })
    }];

    /** @const {!Array<did.DecryptedSections>} */
    const kpasses = Array(5);

    for (let i = 0; i < kpasses.length; ++i) {
      kpasses[i] = /** @type {!did.DecryptedSections} */(
        structuredClone(kpass[i % 3]));
      sign(kpasses[i], commitment, commitmentAnon, 1337, BigInt(i + 10));
    }

    /** @const {!did.DecryptedSections} */
    const combined = combineMultiple(kpasses, commitmentR, commitmentAnonR, 3);
    expect(combined["personInfo"].secp256k1.length).toBe(5);
    expect(Object.keys(combined).length).toBe(1);

    expect(recoverSectionSigners("personInfo", combined["personInfo"], ownerAddress))
      .toEqual([vm.addr(10n), vm.addr(11n), vm.addr(12n), vm.addr(13n), vm.addr(14n)]);
  })
});

describe("`toUnlockableNFT()` tests", () => {
  test("serialize to / from unlockable NFT", () => {
    /** @const {!Signer} */
    const signer = new MockSigner(1337n);

    return toUnlockableNFT(/** @type {!eth.ERC721Metadata} */({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }), /** @type {!did.DecryptedSections} */({
      "contactInfo": /** @type {!did.ContactInfo} */({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      })
    }), [/** @type {!SectionGroup} */({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo"]
    })],
      signer,
      vm.addr(1337n)
    ).then((/** @type {!eth.ERC721Unlockable} */ nft) => fromUnlockableNFT(
      nft, ["contactInfo"], signer, vm.addr(1337n))
    ).then((/** @type {!did.DecryptedSections} */ decryptedSections) => {
      expect("contactInfo" in decryptedSections).toBeTrue();
      /** @const {!did.ContactInfo} */
      const contactInfo = /** @type {!did.ContactInfo} */(
        decryptedSections["contactInfo"]);
      expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
      expect(contactInfo.phone).toBe("123456789");
    });
  });

  test("serialize to / from unlockable NFT with multiple sections", () => {
    /**
     * @type {!Signer}
     * @const
     */
    const signer = new MockSigner(1338n);

    return toUnlockableNFT(/** @type {!eth.ERC721Metadata} */({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }), /** @type {!did.DecryptedSections} */({
      "contactInfo": /** @type {!did.ContactInfo} */({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Halıcı",
        last: "Halıcıoğlu"
      }),
    }), [/** @type {!SectionGroup} */({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo", "personInfo"]
    })],
      signer,
      vm.addr(1338n)
    ).then((/** @type {!eth.ERC721Unlockable} */ nft) => fromUnlockableNFT(
      nft, ["contactInfo", "personInfo"], signer, vm.addr(1338n))
    ).then((/** @type {!did.DecryptedSections} */ decryptedSections) => {
      expect(Object.keys(decryptedSections)).toEqual(["contactInfo", "personInfo"]);
      /** @const {!did.ContactInfo} */
      const contactInfo = /** @type {!did.ContactInfo} */(decryptedSections["contactInfo"]);
      /** @const {!did.PersonInfo} */
      const personInfo = /** @type {!did.PersonInfo} */(decryptedSections["personInfo"]);
      expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
      expect(contactInfo.phone).toBe("123456789");
      expect(personInfo.first).toBe("Halıcı");
      expect(personInfo.last).toBe("Halıcıoğlu");
    });
  });
});

import { keccak256Uint8 } from "/crypto/sha3";
import {
  combineMultiple, fromUnlockableNFT, SectionGroup, selectEncryptedSections,
  sign,
  toUnlockableNFT
} from "/did/decryptedSections";
import { commit, recoverSectionSigners } from "/did/section";
import { assert, assertElemEq, assertEq } from "/testing/assert";
import { FakeSigner, Signer } from "/testing/crosschain";
import vm from "/testing/vm";
import { base64 } from "/util/çevir";

const testSelectEncryptedSections = () => {
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
  const check = (sections, expected) =>
    assertElemEq(
      selectEncryptedSections(encryptedSectionsKeys, sections),
      expected
    );

  const testSimple = () => {
    check(["a"], ["a"]);
    check(["b"], ["a,b"]);
    check(["c"], ["c,d"]);
    check(["d"], ["c,d"]);
    check(["e"], ["c,d,e"]);
    check(["a", "b"], ["a,b"]);
    check(["a", "c"], ["a,b,c"]);
    check(["a", "b", "d"], ["a,b,c,d"]);
  }

  const testTwoUnlockables = () => {
    check(["a", "e"], ["a", "c,d,e"]);
    check(["b", "e"], ["b,c,d", "c,d,e"]);
    check(["a", "b", "e"], ["a,b", "c,d,e"]);

    check(["A", "B", "C", "D"], ["A,B,C,E,F,G", "A,B,D,E,F,G"])
  }

  const testGreedy = () => {
    check(["1", "2", "3", "4"], ["1,2,u", "1,3,u,v", "1,4,u,v,s"]);
    check(["a", "e", "1", "2"], ["a", "c,d,e", "1,2,u"]);
    check(["a", "e", "1", "2", "4"], ["a", "c,d,e", "1,2,u", "1,4,u,v,s"]);
  }
  testSimple();
  testTwoUnlockables();
  testGreedy();
}

const testCombineMultiple = () => {
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

  assertEq(Object.keys(combined).length, Object.keys(kpass).length);

  assertEq(combined["humanID"].secp256k1.length, 5);
  assertEq(combined["personInfo"].secp256k1.length, 5);
  assertEq(combined["humanID"].commitmentR, commitmentAnonR);
  assertEq(combined["personInfo"].commitmentR, commitmentR);

  /** @const {!Array<!bigint>} */
  const signers = [vm.addr(10n), vm.addr(11n), vm.addr(12n), vm.addr(13n), vm.addr(14n)];
  assertElemEq(
    recoverSectionSigners("humanID", combined["humanID"], ownerAddress),
    signers
  );
  assertElemEq(
    recoverSectionSigners("personInfo", combined["personInfo"], ownerAddress),
    signers
  );
  assertEq(combined["humanID"].commitment, commitmentAnon);
  assertEq(combined["personInfo"].commitment, commitment);
}

const testCombineMultipleConflicting = () => {
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
  assertEq(combined["personInfo"].secp256k1.length, 5);
  assertEq(combined["humanID"].secp256k1.length, 3);

  assertElemEq(
    recoverSectionSigners("humanID", combined["humanID"], ownerAddress),
    [vm.addr(12n), vm.addr(13n), vm.addr(14n)]
  );
  assertElemEq(
    recoverSectionSigners("personInfo", combined["personInfo"], ownerAddress),
    [vm.addr(10n), vm.addr(11n), vm.addr(12n), vm.addr(13n), vm.addr(14n)]
  );
}

const testCombineMultipleInsufficient = () => {
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
  assertEq(combined["personInfo"].secp256k1.length, 5);
  assertEq(Object.keys(combined).length, 1);

  assertElemEq(
    recoverSectionSigners("personInfo", combined["personInfo"], ownerAddress),
    [vm.addr(10n), vm.addr(11n), vm.addr(12n), vm.addr(13n), vm.addr(14n)]
  );
}

/**
 * @return {!Promise<void>}
 */
const testToNFTfromNFT = () => {
  /** @const {!Signer} */
  const signer = new FakeSigner(1337n);

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
    assert("contactInfo" in decryptedSections);
    /** @const {!did.ContactInfo} */
    const contactInfo = /** @type {!did.ContactInfo} */(
      decryptedSections["contactInfo"]);
    assertEq(contactInfo.email, "halı@halıcıoğlu.com");
    assertEq(contactInfo.phone, "123456789");
  });
}

/**
 * @return {!Promise<void>}
 */
const testToNFTfromNFTMultiple = () => {
  /**
   * @type {!Signer}
   * @const
   */
  const signer = new FakeSigner(1338n);

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
    assertElemEq(Object.keys(decryptedSections), ["contactInfo", "personInfo"]);
    /** @const {!did.ContactInfo} */
    const contactInfo = /** @type {!did.ContactInfo} */(decryptedSections["contactInfo"]);
    /** @const {!did.PersonInfo} */
    const personInfo = /** @type {!did.PersonInfo} */(decryptedSections["personInfo"]);
    assertEq(contactInfo.email, "halı@halıcıoğlu.com");
    assertEq(contactInfo.phone, "123456789");
    assertEq(personInfo.first, "Halıcı");
    assertEq(personInfo.last, "Halıcıoğlu");
  });
}

testToNFTfromNFT();
testToNFTfromNFTMultiple();
testSelectEncryptedSections();
testCombineMultiple();
testCombineMultipleConflicting();
testCombineMultipleInsufficient();

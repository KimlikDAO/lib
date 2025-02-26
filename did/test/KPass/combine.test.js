import { describe, expect, test } from "bun:test";
import { ChainGroup } from "../../../crosschain/chains";
import { keccak256Uint8 } from "../../../crypto/sha3";
import { addr as evmAddr } from "../../../ethereum/mock/signer";
import base64 from "../../../util/base64";
import { commit } from "../../commitment";
import { combineMultiple } from "../../KPass";
import { recoverSectionSigners, signDecryptedSections } from "../../sectionSigner";

describe("Combinig multiple KPass'es", () => {
  test("combined KPass has all signatures", () => {
    /** @const {!TextEncoder} */
    const encoder = new TextEncoder();
    /** @const {string} */
    const ownerAddress = evmAddr(1n);
    /** @const {string} */
    const commitmentR = base64.from(keccak256Uint8(encoder.encode("commitmentR")));
    /** @const {string} */
    const commitmentAnonR = base64.from(keccak256Uint8(encoder.encode("commitmentAnonR")));
    /** @const {string} */
    const commitment = commit(ChainGroup.EVM, ownerAddress, commitmentR);
    /** @const {string} */
    const commitmentAnon = commit(ChainGroup.EVM, ownerAddress, commitmentAnonR);

    /** @const {did.DecryptedSections} */
    const kpass = {
      "humanID": /** @type {!did.HumanID} */ ({
        id: "9e10e195f5c4fb987af3077fe241ff7108d39ed7a3b2908da6a37778ad75ee39",
      }),
      "personInfo": /** @type {!did.PersonInfo} */ ({
        first: "Kaan",
        last: "Ankara",
      }),
    };

    /** @const {!Array<did.DecryptedSections>} */
    const kpasses = Array(5);
    for (let i = 0; i < kpasses.length; ++i) {
      kpasses[i] = /** @type {did.DecryptedSections} */ (structuredClone(kpass));
      signDecryptedSections(kpasses[i], {
        commitment,
        commitmentAnon,
        signatureTs: 1337,
        privateKey: BigInt(i + 10),
        privateKeyPallas: BigInt(i + 100),
      });
    }

    /** @const {did.DecryptedSections} */
    const combined = combineMultiple(kpasses, commitmentR, commitmentAnonR, 5);

    expect(Object.keys(combined).length).toBe(Object.keys(kpass).length);
    expect(combined["humanID"].secp256k1.length).toBe(5);
    expect(combined["personInfo"].secp256k1.length).toBe(5);
    expect(combined["humanID"].commitmentR).toBe(commitmentAnonR);
    expect(combined["personInfo"].commitmentR).toBe(commitmentR);
    /** @const {!Array<string>} */
    const signers = [
      evmAddr(10n),
      evmAddr(11n),
      evmAddr(12n),
      evmAddr(13n),
      evmAddr(14n),
    ];
    expect(recoverSectionSigners(
      "humanID", combined["humanID"], ChainGroup.EVM, ownerAddress
    )).toEqual(signers);
    expect(recoverSectionSigners(
      "personInfo", combined["personInfo"], ChainGroup.EVM, ownerAddress
    )).toEqual(signers);
    expect(combined["humanID"].commitment).toBe(commitmentAnon);
    expect(combined["personInfo"].commitment).toBe(commitment);
  });

  test("combine multiple conflicting KPass'es", () => {
    /** @const {!TextEncoder} */
    const encoder = new TextEncoder();
    /** @const {string} */
    const ownerAddress = evmAddr(1n);

    /** @const {string} */
    const commitmentR = base64.from(keccak256Uint8(encoder.encode("commitmentR")));
    /** @const {string} */
    const commitmentAnonR = base64.from(keccak256Uint8(encoder.encode("commitmentAnonR")));

    /** @const {string} */
    const commitment = commit(ChainGroup.EVM, ownerAddress, commitmentR);
    /** @const {string} */
    const commitmentAnon = commit(
      ChainGroup.EVM,
      ownerAddress,
      commitmentAnonR
    );

    /** @const {did.DecryptedSections} */
    const kpass1 = {
      "humanID": /** @type {!did.HumanID} */ ({
        id: "9e10e195f5c4fb987af3077fe241ff7108d39ed7a3b2908da6a37778ad75ee39",
      }),
      "personInfo": /** @type {!did.PersonInfo} */ ({
        first: "Kaan",
        last: "Ankara",
      }),
    };

    /** @const {did.DecryptedSections} */
    const kpass2 = {
      "humanID": /** @type {!did.HumanID} */ ({
        id: "793ae065c561c060048762a8a9112f0645574f76a9179169cf446147564ff373",
      }),
      "personInfo": /** @type {!did.PersonInfo} */ ({
        first: "Kaan",
        last: "Ankara",
      }),
    };

    /** @const {!Array<did.DecryptedSections>} */
    const kpasses = Array(5);

    for (let i = 0; i < kpasses.length; ++i) {
      kpasses[i] = /** @type {did.DecryptedSections} */ (
        i < 2 ? structuredClone(kpass1) : structuredClone(kpass2)
      );
      signDecryptedSections(kpasses[i], {
        commitment,
        commitmentAnon,
        signatureTs: 1337,
        privateKey: BigInt(10 + i),
        privateKeyPallas: BigInt(100 + i),
      });
    }

    /** @const {did.DecryptedSections} */
    const combined = combineMultiple(kpasses, commitmentR, commitmentAnonR, 3);
    expect(combined["personInfo"].secp256k1.length).toBe(5);
    expect(combined["humanID"].secp256k1.length).toBe(3);

    expect(recoverSectionSigners(
      "humanID", combined["humanID"], ChainGroup.EVM, ownerAddress
    )).toEqual([evmAddr(12n), evmAddr(13n), evmAddr(14n)]);
    expect(recoverSectionSigners(
      "personInfo", combined["personInfo"], ChainGroup.EVM, ownerAddress
    )).toEqual([
      evmAddr(10n),
      evmAddr(11n),
      evmAddr(12n),
      evmAddr(13n),
      evmAddr(14n),
    ]);
  });

  test("combine multiple with below-threshold signatures", () => {
    /** @const {!TextEncoder} */
    const encoder = new TextEncoder();
    /** @const {string} */
    const ownerAddress = evmAddr(1n);
    /** @const {string} */
    const commitmentR = base64.from(keccak256Uint8(encoder.encode("commitmentR")));
    /** @const {string} */
    const commitmentAnonR = base64.from(keccak256Uint8(encoder.encode("commitmentAnonR")));
    /** @const {string} */
    const commitment = commit(ChainGroup.EVM, ownerAddress, commitmentR);
    /** @const {string} */
    const commitmentAnon = commit(ChainGroup.EVM, ownerAddress, commitmentAnonR);

    /** @const {!Array<did.DecryptedSections>} */
    const kpass = [
      {
        "humanID": /** @type {!did.HumanID} */ ({
          id: "9e10e195f5c4fb987af3077fe241ff7108d39ed7a3b2908da6a37778ad75ee39",
        }),
        "personInfo": /** @type {!did.PersonInfo} */ ({
          first: "Kaan",
          last: "Ankara",
        }),
      },
      {
        "humanID": /** @type {!did.HumanID} */ ({
          id: "793ae065c561c060048762a8a9112f0645574f76a9179169cf446147564ff373",
        }),
        "personInfo": /** @type {!did.PersonInfo} */ ({
          first: "Kaan",
          last: "Ankara",
        }),
      },
      {
        "humanID": /** @type {!did.HumanID} */ ({
          id: "9d370663d573b5c6ada65204a460c4464c0a390d7b1310a92be773731a07e821",
        }),
        "personInfo": /** @type {!did.PersonInfo} */ ({
          first: "Kaan",
          last: "Ankara",
        }),
      },
    ];

    /** @const {!Array<did.DecryptedSections>} */
    const kpasses = Array(5);

    for (let i = 0; i < kpasses.length; ++i) {
      kpasses[i] = /** @type {did.DecryptedSections} */ (
        structuredClone(kpass[i % 3])
      );
      signDecryptedSections(kpasses[i], {
        commitment,
        commitmentAnon,
        signatureTs: 1337,
        privateKey: BigInt(10 + i),
        privateKeyPallas: BigInt(100 + i),
      });
    }

    /** @const {did.DecryptedSections} */
    const combined = combineMultiple(kpasses, commitmentR, commitmentAnonR, 3);
    expect(combined["personInfo"].secp256k1.length).toBe(5);
    expect(Object.keys(combined).length).toBe(1);

    expect(
      recoverSectionSigners(
        "personInfo",
        combined["personInfo"],
        ChainGroup.EVM,
        ownerAddress
      )
    ).toEqual([
      evmAddr(10n),
      evmAddr(11n),
      evmAddr(12n),
      evmAddr(13n),
      evmAddr(14n),
    ]);
  });
});

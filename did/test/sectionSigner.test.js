import { expect, test } from "bun:test";
import { ChainGroup } from "../../crosschain/chains";
import { addr as evmAddr } from "../../ethereum/mock/signer";
import { PublicKey } from "../../mina/mina";
import { addr as minaAddr } from "../../mina/mock/signer";
import { base64 } from "../../util/çevir";
import { commit } from "../commitment";
import {
  recoverHumanIDSigners,
  recoverSectionSigners,
  signSection
} from "../sectionSigner";

test("sign section", () => {
  /** @const {!did.HumanID} */
  const humanID1 = /** @type {!did.HumanID} */({
    id: "1234A234"
  })
  /** @const {!did.HumanID} */
  const humanID2 = /** @type {!did.HumanID} */({
    id: "1234A234",
    bls12_381: "asdfadsf",
    secp256k1: ["incorrect_sign"]
  })
  /** @const {string} */
  const commitmentR = base64([1, 2, 3]);
  /** @const {number} */
  const signatureTs = Date.now() / 1000 | 0;
  /** @const {string} */
  const ownerAddress = new PublicKey(1n, true).toBase58();
  /** @const {string} */
  const commitment = commit(ChainGroup.MINA, ownerAddress, commitmentR);
  signSection("humanID", humanID1, {
    commitment,
    commitmentAnon: commitment,
    signatureTs,
    privateKey: 11n,
    privateKeyPallas: 12n,
  });
  signSection("humanID", humanID2, {
    commitment,
    commitmentAnon: commitment,
    signatureTs,
    privateKey: 12n,
    privateKeyPallas: 13n
  });

  // The owner attaches the commitmentR.
  delete humanID1.commitment;
  delete humanID2.commitment;
  humanID1.commitmentR = commitmentR;
  humanID2.commitmentR = commitmentR;

  expect(humanID1.secp256k1.length).toBe(1);
  expect(humanID2.secp256k1.length).toBe(1);
  expect(recoverSectionSigners("humanID", humanID1, ChainGroup.MINA, ownerAddress)[0])
    .toBe(evmAddr(11n));
  expect(recoverSectionSigners("humanID", humanID2, ChainGroup.MINA, ownerAddress)[0])
    .toBe(evmAddr(12n));

  humanID1.secp256k1.push(humanID2.secp256k1[0]);

  expect(new Set(recoverSectionSigners("humanID", humanID1, ChainGroup.MINA, ownerAddress)))
    .toEqual(new Set([evmAddr(11n), evmAddr(12n)]));

  humanID1.secp256k1.push(humanID2.secp256k1[0]);

  expect(new Set(recoverSectionSigners("humanID", humanID1, ChainGroup.MINA, ownerAddress)))
    .toEqual(new Set([evmAddr(11n), evmAddr(12n)]))
});

test("humanID minaSchnorr signature", () => {
  /** @const {!did.HumanID} */
  const humanID1 = /** @type {!did.HumanID} */({
    id: "1234A234"
  })
  /** @const {!did.HumanID} */
  const humanID2 = /** @type {!did.HumanID} */({
    id: "1234A234",
    bls12_381: "asdfadsf",
    secp256k1: ["incorrect_sign"]
  })
  /** @const {string} */
  const commitmentR = base64([1, 2, 3]);
  /** @const {number} */
  const signatureTs = Date.now() / 1000 | 0;
  /** @const {string} */
  const ownerAddress = new PublicKey(1n, true).toBase58();
  /** @const {string} */
  const commitment = commit(ChainGroup.MINA, ownerAddress, commitmentR);
  signSection("humanID", humanID1, {
    commitment,
    commitmentAnon: commitment,
    signatureTs,
    privateKey: 11n,
    privateKeyPallas: 111n,
  });
  signSection("humanID", humanID2, {
    commitment,
    commitmentAnon: commitment,
    signatureTs,
    privateKey: 12n,
    privateKeyPallas: 112n
  });

  delete humanID1.commitment;
  humanID1.commitmentR = commitmentR;

  const signers = recoverHumanIDSigners(humanID1, ownerAddress);

  expect(signers.length).toBe(1);
  expect(signers[0]).toBe(minaAddr(111n));

  humanID2.minaSchnorr.push(...(humanID1.minaSchnorr || []));

  const signers2 = recoverHumanIDSigners(humanID2, ownerAddress);

  expect(signers2.length).toBe(2);
  expect(new Set(signers2)).toEqual(new Set([minaAddr(111n), minaAddr(112n)]));
});

import { expect, test } from "bun:test";
import { ChainGroup } from "../../crosschain/chains";
import { poseidon } from "../../crypto/minaPoseidon";
import { keccak256Uint8 } from "../../crypto/sha3";
import { addr } from "../../ethereum/mock/signer";
import { PublicKey } from "../../mina/mina";
import base64 from "../../util/base64";
import bigints from "../../util/bigints";
import { commit, commitDouble } from "../commitment";

test("EVM commit with 0 input", () => {
  expect(commit(ChainGroup.EVM, "0x" + "0".repeat(40), base64.from(new Uint8Array(32))))
    .toBe(base64.from(keccak256Uint8(new Uint8Array(52))));
});

test("MINA commit with select values", () => {
  const buff = new Uint8Array(32);
  bigints.intoBytesLE(buff, poseidon([0n, 32n]))

  expect(base64.toBytes(commit(
    ChainGroup.MINA,
    new PublicKey(31n, true).toBase58(),
    base64.from(new Uint8Array(32))
  )))
    .toEqual(buff);
});

test("MINA commitDouble()", () => {
  const r = new Uint8Array(64);
  r[0] = 1;
  r[32] = 2;
  let c = commitDouble(ChainGroup.MINA, new PublicKey(31n, false).toBase58(), r);

  expect(bigints.fromBytesLE(c.subarray(0, 32))).toBe(poseidon([1n, 31n]));
  expect(bigints.fromBytesLE(c.subarray(32, 64))).toBe(poseidon([2n, 31n]));
});

test("MINA commitDouble()", () => {
  const r = new Uint8Array(64);
  r[0] = 1;
  r[32] = 2;
  let c = commitDouble(ChainGroup.MINA, new PublicKey(31n, true).toBase58(), r);

  expect(bigints.fromBytesLE(c.subarray(0, 32))).toBe(poseidon([1n, 32n]));
  expect(bigints.fromBytesLE(c.subarray(32, 64))).toBe(poseidon([2n, 32n]));
});

test("commit() == commitDouble()[0] on EVM", () => {
  const evmAddr = addr(123123n);
  const random = /** @type {Uint8Array} */(crypto.getRandomValues(new Uint8Array(64)));

  let commitment = commitDouble(ChainGroup.EVM, evmAddr, random);

  expect(base64.from(commitment.subarray(0, 32)))
    .toBe(commit(ChainGroup.EVM, evmAddr, base64.from(random.subarray(0, 32))));
  expect(base64.from(commitment.subarray(32)))
    .toBe(commit(ChainGroup.EVM, evmAddr, base64.from(random.subarray(32))));
});

test("commit() == commitDouble()[0] on MINA", () => {
  const minaAddr = new PublicKey(1337n, false).toBase58();
  const random = /** @type {Uint8Array} */(crypto.getRandomValues(new Uint8Array(64)));

  let commitment = commitDouble(ChainGroup.MINA, minaAddr, random);

  expect(base64.from(commitment.subarray(0, 32)))
    .toBe(commit(ChainGroup.MINA, minaAddr, base64.from(random.subarray(0, 32))));
  expect(base64.from(commitment.subarray(32)))
    .toBe(commit(ChainGroup.MINA, minaAddr, base64.from(random.subarray(32))));
});

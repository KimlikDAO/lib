import { createEVM } from "@ethereumjs/evm";
import { createZeroAddress } from "@ethereumjs/util";
import { expect, test } from "bun:test";
import { keccak256Uint8 } from "../../../crypto/sha3";
import { assemble } from "../assembler";
import { calldataLoad, mstore, ret } from "../builtins";
import { array, calldata as calldataLayout } from "../array";
import { Op } from "../opcodes";
import { verifyMerkle } from "../recipes/merkle";
import { Data, Uint } from "../types";

const word = (lastByte: number): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(32);
  out[31] = lastByte;
  return out;
}

const wordBigint = (value: bigint): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(32);
  for (let i = 31; 0 <= i; --i) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

const concat = (...chunks: readonly Uint8Array[]): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

const pairHash = (left: Uint8Array, right: Uint8Array): Uint8Array =>
  keccak256Uint8(concat(left, right));

const rootOf = (
  leaf: Uint8Array,
  proof: readonly Uint8Array[],
  index: bigint,
): Uint8Array => {
  let hash = leaf;
  for (const sibling of proof) {
    hash = index & 1n ? pairHash(sibling, hash) : pairHash(hash, sibling);
    index >>= 1n;
  }
  return hash;
}

const encodeCalldata = (
  leaf: Uint8Array,
  index: bigint,
  proof: readonly Uint8Array[],
): Uint8Array<ArrayBuffer> => concat(leaf, wordBigint(index), ...proof);

const runVerifier = async (
  depth: number,
  root: Uint8Array,
  data: Uint8Array,
): Promise<Uint8Array> => {
  const evm = await createEVM();
  await evm.stateManager.putStorage(
    createZeroAddress(),
    new Uint8Array(32),
    root,
  );
  const result = await evm.runCode({ code: verifyMerkleProgram(depth), data });
  expect(result.exceptionError).toBeUndefined();
  return result.returnValue;
}

const verifyMerkleProgram = (depth: number): Uint8Array<ArrayBuffer> =>
  assemble(
    mstore(0, verifyMerkle(depth)(
      calldataLoad(0, Data),
      calldataLoad(32, Uint),
      calldataLayout({
        leaf: [0, Data],
        index: [32, Uint],
        proof: [64, array(Data, depth)],
      }).proof,
    )),
    ret(0, 32),
  );

test("verifyMerkle assembles a fixed-depth verifier", () => {
  const verifier = verifyMerkle(2);
  const program = verifyMerkleProgram(2);

  expect(String(verifier(
    calldataLoad(0, Data),
    calldataLoad(32, Uint),
    calldataLayout({ proof: [64, array(Data, 2)] }).proof,
  ).frag.signature)).toBe("(Data, Uint) → 2|Bool");
  expect(program).toContain(Op.CALLDATALOAD);
  expect(program).toContain(Op.MSTORE);
  expect(program).toContain(Op.SHA3);
  expect(program).toContain(Op.SLOAD);
  expect(program).toContain(Op.RETURN);
  expect(verifyMerkleProgram(32).length).toBeGreaterThan(0);
});

test("verifyMerkle accepts and rejects proofs against storage root", async () => {
  const leaf = word(0x11);
  const proof = [word(0x22), word(0x33)];
  const index = 1n;
  const root = rootOf(leaf, proof, index);
  const data = encodeCalldata(leaf, index, proof);

  const valid = await runVerifier(2, root, data);
  expect(valid).toEqual(wordBigint(1n));

  const badRoot = root.slice();
  badRoot[0] ^= 1;
  const invalid = await runVerifier(2, badRoot, data);
  expect(invalid).toEqual(wordBigint(0n));
});

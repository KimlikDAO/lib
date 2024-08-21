import { expect, test } from "bun:test";
import { ChainGroup } from "../../crosschain/chains";
import { poseidon } from "../../crypto/minaPoseidon";
import { keccak256Uint8 } from "../../crypto/sha3";
import { PublicKey } from "../../mina/mina";
import { base64, base64tenSayıya } from "../../util/çevir";
import { commit } from "../commitment";

test("EVM commit with 0 input", () => {
  expect(commit(ChainGroup.EVM, "0x" + "0".repeat(40), base64(new Uint8Array(32))))
    .toBe(base64(keccak256Uint8(new Uint8Array(52))));
});

test("MINA commit with select values", () => {
  expect(base64tenSayıya(commit(
    ChainGroup.MINA,
    new PublicKey(31n, true).toBase58(),
    base64(new Uint8Array(32))
  )))
    .toBe(poseidon([0n, 32n]));
});

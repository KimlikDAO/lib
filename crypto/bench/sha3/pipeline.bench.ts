/**
 * Full-string Keccak: conformance.test compares these two pipelines.
 * Orig fuses UTF-8 + blocks + Uint32Array s; ours uses TextEncoder + keccak256Uint8(Array s).
 */
import { bench } from "../../../util/testing/bench";
import { keccak256 } from "../../sha3";
import { keccak256 as keccak256_orig } from "../../test/sha3/sha3_orig";

const REPEAT = 80;
const S1 = "zsss".repeat(200);
const S2 = "test string".repeat(400);
const S3 = "á".repeat(300);

const sumHexHead = (hex: string): number =>
  (parseInt(hex.slice(0, 8), 16) | 0) ^ (parseInt(hex.slice(8, 16), 16) | 0);

bench("sha3 pipeline: string → hash (orig vs TextEncoder+keccak256Uint8)", {
  "keccak256_orig (string→blocks, Uint32Array s)": (s: string) =>
    sumHexHead(keccak256_orig(s)),
  "keccak256 (TextEncoder + Array s)": (s: string) =>
    sumHexHead(keccak256(s)),
}, {
  repeat: REPEAT,
  dataset: [
    { args: [S1], expected: sumHexHead(keccak256(S1)) },
    { args: [S2], expected: sumHexHead(keccak256(S2)) },
    { args: [S3], expected: sumHexHead(keccak256(S3)) },
  ],
});

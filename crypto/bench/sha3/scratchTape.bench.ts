import { bench } from "@kimlikdao/kdts/bench";
import { f } from "../../sha3";

const REPEAT = 200;
const ROUNDS = 80;

/** Warm f with Array then run timed loops */
const benchArrayScratch = (): number => {
  const s = Array(50);
  for (let i = 0; i < 50; ++i) s[i] = 0;
  const words = new Uint32Array(34);
  for (let i = 0; i < 34; ++i) words[i] = i * 0x9e3779b9 | 0;
  for (let r = 0; r < ROUNDS; ++r) {
    for (let j = 0; j < 34; ++j) s[j] ^= words[j];
    f(s);
  }
  let x = 0;
  for (let i = 0; i < 8; ++i) x ^= s[i] | 0;
  return x;
};

const benchUint32Scratch = (): number => {
  const s = new Uint32Array(50);
  const words = new Uint32Array(34);
  for (let i = 0; i < 34; ++i) words[i] = i * 0x9e3779b9 | 0;
  for (let r = 0; r < ROUNDS; ++r) {
    for (let j = 0; j < 34; ++j) s[j] ^= words[j];
    f(s);
  }
  let x = 0;
  for (let i = 0; i < 8; ++i) x ^= s[i];
  return x;
};

/** Reuse one global scratch (amortize alloc) */
const sArr = Array(50);
for (let i = 0; i < 50; ++i) sArr[i] = 0;
const sU32 = new Uint32Array(50);
const words = new Uint32Array(34);
for (let i = 0; i < 34; ++i) words[i] = i * 0x9e3779b9 | 0;

const benchArrayReuse = (): number => {
  for (let i = 0; i < 50; ++i) sArr[i] = 0;
  for (let r = 0; r < ROUNDS; ++r) {
    for (let j = 0; j < 34; ++j) sArr[j] ^= words[j];
    f(sArr);
  }
  let x = 0;
  for (let i = 0; i < 8; ++i) x ^= sArr[i] | 0;
  return x;
};

const benchUint32Reuse = (): number => {
  sU32.fill(0);
  for (let r = 0; r < ROUNDS; ++r) {
    for (let j = 0; j < 34; ++j) sU32[j] ^= words[j];
    f(sU32);
  }
  let x = 0;
  for (let i = 0; i < 8; ++i) x ^= sU32[i];
  return x;
};

const eArr = benchArrayScratch();
const eU32 = benchUint32Scratch();
if (eArr != eU32)
  throw "scratchTape: Array vs Uint32 f state mismatch";

bench("sha3 scratchTape: f(s) only, Array(50) vs Uint32Array(50)", {
  "Array(50) alloc per call": benchArrayScratch,
  "Uint32Array(50) alloc per call": benchUint32Scratch,
  "Array(50) reuse": benchArrayReuse,
  "Uint32Array(50) reuse": benchUint32Reuse,
}, {
  repeat: REPEAT,
  dataset: [
    { args: [], expected: eArr },
  ],
});

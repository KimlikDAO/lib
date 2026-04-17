import { bench } from "@kimlikdao/kdts/bench";
import { f, keccak256Uint32 } from "../../sha3";

/** @satisfies {PureFn} */
const keccak256Uint32_typed = (words: Uint32Array): Uint32Array => {
  const s: Uint32Array = new Uint32Array(50);
  for (let i = 0; i < 50; ++i) s[i] = 0;
  let i = 0;
  for (const end = words.length - 33; i < end; i += 34) {
    for (let j = 0; j < 34; ++j)
      s[j] ^= words[i + j];
    f(s);
  }
  let j = 0;
  for (; i < words.length; ++i, ++j) {
    s[j] ^= words[i];
  }
  s[j] ^= 1;
  s[33] ^= 1 << 31;
  f(s);
  return s.subarray(0, 8);
};

/** @satisfies {PureFn} */
const keccak256Uint32_loop = (words: Uint32Array): Uint32Array => {
  const s = Array(50);
  let i = 0;
  for (const end = words.length - 33; i < end; i += 34) {
    for (let j = 0; j < 34; ++j)
      s[j] ^= words[i + j];
    f(s);
  }
  let j = 0;
  for (; i < words.length; ++i, ++j)
    s[j] ^= words[i];
  s[j] ^= 1;
  s[33] ^= 1 << 31;
  f(s);
  const out = new Uint32Array(8);
  for (let i = 0; i < 8; ++i)
    out[i] = s[i];
  return out;
}

const sumHash = (h: Uint32Array): number => {
  let sum = 0;
  for (let i = 0; i < 8; ++i) sum += h[i];
  return sum;
};

bench("keccak256Uint32: Uint32Array vs number[] scratch tape.", {
  "keccak256Uint32 Uint32Array(50)":
    (words: Uint32Array) => sumHash(keccak256Uint32_typed(words)),
  "keccak256Uint32 number[50]":
    (words: Uint32Array) => sumHash(keccak256Uint32(words)),
  "keccak256Uint32 number[50] loop":
    (words: Uint32Array) => sumHash(keccak256Uint32_loop(words)),
}, {
  repeat: 100,
  dataset: [{
    input: Uint32Array.from("123456"), output: 14435971454
  }, {
    input: Uint32Array.from("654321"), output: 16036270301
  },{
    input: Uint32Array.from("364125"), output: 14650777862
  },{
    input: Uint32Array.from("164325"), output: 14414650566
  }],
});

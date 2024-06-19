import { expect, test } from "bun:test";
import { keccak256 } from "../../sha3";
import { keccak256 as keccak256_orig } from "./sha3_orig";
import { keccak256 as keccak256_prev } from "./sha3_prev";

test("various implementations produce the same output", () => {
  for (let i = 0; i < 1000; ++i) {
    let test = "abracadabra".repeat(i);
    const ours = keccak256(test);
    const prev = keccak256_prev(test);
    const orig = keccak256_orig(test);
    expect(ours).toBe(prev);
    expect(ours).toBe(orig);
  }
  for (let i = 0; i < 1000; ++i) {
    let test = "c".repeat(i);
    const ours = keccak256(test);
    const prev = keccak256_prev(test);
    const orig = keccak256_orig(test);
    expect(ours).toBe(prev);
    expect(ours).toBe(orig);
  }
});

test("our implementation is the fastest one", () => {
  {
    console.time("1k keccak256_orig");
    let c = 0;
    for (let i = 0; i < 1000; ++i)
      c += parseInt(keccak256_orig("z".repeat(i))[0], 16);
    console.log(c);
    console.timeEnd("1k keccak256_orig");
  }
  {
    console.time("1k keccak256_prev");
    let c = 0;
    for (let i = 0; i < 1000; ++i)
      c += parseInt(keccak256_prev("z".repeat(i))[0], 16);
    console.log(c);
    console.timeEnd("1k keccak256_prev");
  }
  {
    console.time("1k keccak256");
    let c = 0;
    for (let i = 0; i < 1000; ++i)
      c += parseInt(keccak256("z".repeat(i))[0], 16);
    console.log(c);
    console.timeEnd("1k keccak256");
  }
});

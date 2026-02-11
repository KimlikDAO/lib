import { test, it, expect } from "bun:test";
import { keccak256Uint32 } from "../sha3";
import { evaluate, generateChallenge, reconstructY } from "../wesolowski";

test("evaluate and reconstruct", () => {
  /** @const {number} */
  const logT = 5;
  /** @const {number} */
  const t = 32;

  for (let i = 1; i <= 2000; ++i) {
    /** @const {!Uint32Array} */
    const g = keccak256Uint32(Uint32Array.from([0, 0, 0, 0, 0, 0, 0, i]));
    const { y, π, l } = evaluate(g, t);
    /** @const {!Uint32Array} */
    const yy = reconstructY(logT, g, π, l);
    expect(y).toEqual(yy);
  }
}, { timeout: 20_000 });

test("generate challenge", () => {
  const a1 = Uint32Array.from("00000001");
  const a2 = Uint32Array.from("00000002");
  const a3 = Uint32Array.from("00000003");
  const c1 = generateChallenge(keccak256Uint32(a1), a2);
  const c2 = generateChallenge(keccak256Uint32(a1), a3);
  const c3 = generateChallenge(keccak256Uint32(a2), a3);

  expect(c1).not.toBe(c2);
  expect(c1).not.toBe(c3);
  expect(c2).not.toBe(c3);
});

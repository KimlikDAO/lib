import { bench } from "../../../util/testing/bench";
import { exp, expTimesExp } from "../../modular";

const expTimesExpViaBigIntMask = (a: bigint, x: bigint, b: bigint, y: bigint, M: bigint): bigint => {
  const c = a * b % M;
  const xLen = x.toString(2).length;
  const yLen = y.toString(2).length;
  const len = Math.max(xLen, yLen);
  let mask = 1n << BigInt(len - 1);
  let r = (x & mask)
    ? (y & mask) ? c : a
    : (y & mask) ? b : 1n;
  mask >>= 1n;
  for (; mask; mask >>= 1n) {
    r = r * r % M;
    const d = (x & mask)
      ? (y & mask) ? c : a
      : (y & mask) ? b : 1n;
    r = r * d % M;
  }
  return r;
};

const Q = 0xDAD19B08F618992D3A5367F0E730B97C6DD113B6A2A493C9EDB0B68DBB1AEC020FB2A64C9644397AB016ABA5B40FA22655060824D9F308984D6734E2439BA08Fn;
const M = (Q - 1n) >> 1n;

bench("a^x b^y (mod M): two exp() vs single-call impls", {
  "two exp()": (a: bigint, x: bigint, b: bigint, y: bigint, M: bigint) => exp(a, x, M) * exp(b, y, M) % M,
  "expTimesExpViaBigIntMask": expTimesExpViaBigIntMask,
  "expTimesExp (current implementation)": expTimesExp,
}, {
  repeat: 1000,
  dataset: [
    { args: [123n, Q - 1n, 15129n, M, Q], expected: 1n },
  ]
});

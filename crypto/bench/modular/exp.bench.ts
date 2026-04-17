import { bench } from "@kimlikdao/kdts/bench";
import { exp } from "../../modular";

const Q = 0xDAD19B08F618992D3A5367F0E730B97C6DD113B6A2A493C9EDB0B68DBB1AEC020FB2A64C9644397AB016ABA5B40FA22655060824D9F308984D6734E2439BA08Fn;
const R = (Q - 1n) >> 1n;

type Input = { a: bigint, x: bigint };

bench(`Compares various exp() algorithms and their implementations.

  Currently the best way to implement montgomery ladder is through toString(2)
  and not bit shifting bigint.
`, {
  "current implementation": ({ a, x }: Input) => exp(a, x, Q),
  "expLTRBinary": ({ a, x }: Input): bigint => {
    const M = Q;
    const xBits = x.toString(2);
    a %= M;
    let r = xBits[0] == '1' ? a : 1n;
    for (let i = 1; i < xBits.length; ++i) {
      r = r * r % M;
      if (xBits.charCodeAt(i) == 49) r = r * a % M;
    }
    return r;
  },
  "expLTRBinary2": ({ a, x }: Input): bigint => {
    const M = Q;
    const xBits = x.toString(2);
    a %= M;
    let r = xBits[0] == '1' ? a : 1n;
    const n = xBits.length;
    for (let i = 1; i < n; ++i) {
      r *= r; r %= M;
      if (xBits[i] == "1") {
        r *= a; r %= M;
      }
    }
    return r;
  },
  "expRTLBinary": ({ a, x }: Input): bigint => {
    const M = Q;
    const xBits = x.toString(2);
    a %= M;
    let r = 1n;
    for (let i = xBits.length - 1; i >= 0; --i) {
      if (xBits.charCodeAt(i) == 49) r = r * a % M;
      a = a * a % M;
    }
    return r;
  },
  "expViaBigInt": ({ a, x }: Input): bigint => {
    const M = Q;
    let res = 1n;
    a %= M;
    for (; x; x >>= 1n) {
      if (x & 1n) res = (res * a) % M;
      a = (a * a) % M;
    }
    return res;
  },
}, {
  repeat: 1000, dataset: [
    { input: { a: 2n, x: Q - 1n }, output: 1n },
    { input: { a: R, x: Q - 1n }, output: 1n },
  ]
});

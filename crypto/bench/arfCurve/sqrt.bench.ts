import { LargeConstant } from "@kimlikdao/kdts";
import { bench } from "@kimlikdao/kdts/bench";

const P = (1n << 256n) - (1n << 32n) - 977n satisfies LargeConstant;

/** @satisfies {PureFn} */
const sqrt1 = (n: bigint): bigint => {
  const tower = (b: bigint, pow: number): bigint => {
    while (pow-- > 0)
      b = b * b % P;
    return b;
  }
  const b2 = (((n * n) % P) * n) % P;
  const b3 = (b2 * b2 * n) % P;
  const b6 = (tower(b3, 3) * b3) % P;
  const b9 = (tower(b6, 3) * b3) % P;
  const b11 = (tower(b9, 2) * b2) % P;
  const b22 = (tower(b11, 11) * b11) % P;
  const b44 = (tower(b22, 22) * b22) % P;
  const b88 = (tower(b44, 44) * b44) % P;
  const b176 = (tower(b88, 88) * b88) % P;
  const b220 = (tower(b176, 44) * b44) % P;
  const b223 = (tower(b220, 3) * b3) % P;
  const t1 = (tower(b223, 23) * b22) % P;
  const t2 = (tower(t1, 6) * b2) % P;
  return tower(t2, 2);
}

/** @satisfies {PureFn} */
const sqrt2 = (n: bigint): bigint => {
  let r = 1n;
  for (let e = (P + 1n) / 4n; e > 0n; e >>= 1n) { // powMod: modular exponentiation.
    if (e & 1n) r = (r * n) % P;
    n = (n * n) % P;
  }
  return r;
}

bench("sqrt() benches", {
  "custom tower formula": sqrt1,
  "powMod": sqrt2,
}, {
  repeat: 10,
  dataset: [{
    input: 100n,
    output: 115792089237316195423570985008687907853269984665640564039457584007908834671653n,
  }],
});

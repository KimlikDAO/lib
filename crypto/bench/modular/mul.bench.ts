import { bench } from "../../../testing/bench";
import bigints from "../../../util/bigints";

/** secp256k1 field prime */
const P = (1n << 256n) - (1n << 32n) - 977n;
const a = bigints.random(32) % P;

/** Pallas field prime (~255-bit) */
const Q = 0x40000000000000000000000000000000224698FC094CF91B992D30ED00000001n;
const b = bigints.random(32) % Q;

bench("x³ mod P (secp256k1-size), x ≈ P/2", {
  "x*x*x % P": (x: bigint) => (x * x * x % P),
  "x*x%P*x%P": (x: bigint) => (x * x % P * x % P),
}, {
  repeat: 1000,
  dataset: [{
    args: [a, P],
    expected: a * a * a % P
  }],
});

bench("x³ mod Q (Pallas-size), x ≈ Q/2", {
  "x*x*x % Q": (x: bigint) => (x * x * x % Q),
  "x*x%Q*x%Q": (x: bigint) => (x * x % Q * x % Q),
}, {
  repeat: 1000,
  dataset: [{
    args: [b, Q],
    expected: b * b * b % Q
  }],
});

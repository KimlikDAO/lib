import { expect, test } from "bun:test";
import { inverse } from "../../modular";

/**
 * Prime used in the secp256k1 curve.
 *
 * @const {bigint}
 */
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;

test("inverse of inverse is the self", () => {
  for (let i = 0; i < 10000; ++i) {
    const n = BigInt(i);
    expect(inverse(inverse(n, P), P)).toBe(n);
  }
  for (let i = 0; i < 10000; ++i) {
    const n = P - BigInt(i) - 1n;
    expect(inverse(inverse(n, P), P)).toBe(n);
  }
});

test("(1/x) * (1/x) == 1 / x^2", () => {
  for (let i = 0; i < 10000; ++i) {
    const x = BigInt(i);
    const x2 = (x * x) % P;
    const ix = inverse(x, P);
    const ix2 = (ix * ix) % P;
    expect(inverse(x2, P)).toBe(ix2);
  }
});

test("(1/x) * (1/x) * (1/x) == 1/x^3", () => {
  for (let i = 0; i < 10000; ++i) {
    const x = BigInt(i) + 123123123123n;
    const x3 = (x * x * x) % P;
    const ix = inverse(x, P);
    const ix3 = (ix * ix * ix) % P;
    expect(inverse(x3, P)).toBe(ix3);
  }
});

test("inverse of the identity and zero", () => {
  for (let /** @type {bigint} */ p of [3n, 5n, 7n, 11n, P]) {
    expect(inverse(1n, p)).toBe(1n)
    expect(inverse(0n, p)).toBe(0n)
    expect(inverse(p - 1n, p)).toBe(p - 1n);
    expect(inverse(4n, inverse(p - 1n, p))).toBe(inverse(4n, p - 1n));
  }

  expect(inverse(0n, P)).toBe(0n);
  expect(inverse(1n, P)).toBe(1n);
  expect(inverse(P - 1n, P)).toBe(P - 1n);
});

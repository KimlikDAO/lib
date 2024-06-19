import { describe, it, test, expect } from "bun:test";
import { exp, exp2, expTimesExp, inverse } from "../modular";

/**
 * Prime used in the secp256k1 curve.
 *
 * @const {!bigint}
 */
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;

describe("Test `inverse()`", () => {
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
    for (let /** !bigint */ p of [3n, 5n, 7n, 11n, P]) {
      expect(inverse(1n, p)).toBe(1n)
      expect(inverse(0n, p)).toBe(0n)
      expect(inverse(p - 1n, p)).toBe(p - 1n);
      expect(inverse(4n, inverse(p - 1n, p))).toBe(inverse(4n, p - 1n));
    }

    expect(inverse(0n, P)).toBe(0n);
    expect(inverse(1n, P)).toBe(1n);
    expect(inverse(P - 1n, P)).toBe(P - 1n);
  })
});

describe("Tests for `exp()`", () => {
  /** @const {!bigint} */
  const Q = 0xDAD19B08F618992D3A5367F0E730B97C6DD113B6A2A493C9EDB0B68DBB1AEC020FB2A64C9644397AB016ABA5B40FA22655060824D9F308984D6734E2439BA08Fn;

  test("smoke tests", () => {
    expect(exp(0n, 1n, 2n)).toBe(0n);
    expect(exp(0n, 0n, 2n)).toBe(1n);
    expect(exp(1n, 0n, 2n)).toBe(1n);
    expect(exp(1n, 1n, 2n)).toBe(1n);
    expect(exp(7n, 5n, 11n)).toBe(10n);
    expect(exp(2n, 5n, 3n)).toBe(2n);
    expect(exp(9n, 0n, 5n)).toBe(1n);
  });

  test("Fermat's little", () => {
    expect(exp(5n, Q - 1n, Q)).toBe(1n);
    expect(exp(333n, Q - 1n, Q)).toBe(1n);
    expect(exp(11n, Q - 1n, Q)).toBe(1n);

    expect(exp(5n, P - 1n, P)).toBe(1n);
    expect(exp(333n, P - 1n, P)).toBe(1n);
    expect(exp(11n, P - 1n, P)).toBe(1n);

    expect(exp(12n, 78n, 131n)).toBe(58n);
    expect(exp(12n, 38n, 133n)).toBe(11n);
  });
})

describe("Tests for `expTimesExp()`", () => {
  test("smoke tests", () => {
    expect(expTimesExp(0n, 1n, 0n, 1n, 2n)).toBe(0n);
    expect(expTimesExp(0n, 0n, 0n, 0n, 2n)).toBe(1n);
    expect(expTimesExp(2n, 2n, 3n, 1n, 100n)).toBe(12n);
    expect(expTimesExp(12n, 38n, 9n, 17n, 133n)).toBe(16n);
    expect(expTimesExp(12n, 38n, 19n, 17n, 133n)).toBe(19n);
    expect(expTimesExp(12n, 38n, 55n, 17n, 133n)).toBe(80n);
    expect(expTimesExp(12n, 38n, 55n, 11231237n, 12938120389123n)).toBe(3120026537850n);
    expect(expTimesExp(123n, 123n, 456n, 456n, 123456n)).toBe(120384n);
  });
});

describe("Test for `exp2()`", () => {
  test("smoke tests", () => {
    expect(exp2(0n, 3n)).toBe(exp(2n, 0n, 3n));
    expect(exp2(10n, 2000n)).toBe(exp(2n, 10n, 2000n));
    expect(exp2(10n, 11n)).toBe(exp(2n, 10n, 11n));
    expect(exp2(10123n, 1100012n)).toBe(exp(2n, 10123n, 1100012n));
  });
});

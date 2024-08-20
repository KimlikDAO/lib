import { describe, expect, test } from "bun:test";
import { exp, exp2, expTimesExp } from "../../modular";

/**
 * Prime used in the secp256k1 curve.
 *
 * @const {bigint}
 */
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;

describe("Tests for `exp()`", () => {
  /** @const {bigint} */
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

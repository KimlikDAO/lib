import { expect, test } from "bun:test";
import { OddPrimes, getNonsmooth, millerRabinBase2 } from "../primes";

test("millerRabinBase2() smoke tests", () => {
  expect(millerRabinBase2(37n, 9n, 2,)).toBeTrue();
  expect(millerRabinBase2(41n, 10n, 2)).toBeTrue();
  expect(millerRabinBase2(17n, 1n, 4)).toBeTrue();

  expect(millerRabinBase2(33n, 1n, 5)).toBeFalse();
  expect(millerRabinBase2(15n, 7n, 1)).toBeFalse();
});

test("`getNonsmooth()` smoke tests", () => {
  expect(getNonsmooth("14c0657979dc9e9ee4efc484d3ebd0e1b9bac788baa47108d976c0a2c48e7"))
    .toBe(0x14c0657979dc9e9ee4efc484d3ebd0e1b9bac788baa47108d976c0a2c48e7141n);
});

test("test sieve never removes primes", () => {
  const t = new Uint8Array(4096);
  for (const p of OddPrimes) {
    let i = (p - 1) * ((p + 1) >> 1) % p;
    i += p;
    for (; i < 4096; i += p)
      t[i] = 1;
  }

  for (let i = 0; i < 4096; ++i)
    if (!t[i])
      expect(millerRabinBase2(BigInt(2 * i + 1), BigInt(i), 1)).toBeTrue();
});

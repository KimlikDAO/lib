import { assert, assertEq } from "../../testing/assert";
import { OddPrimes, getNonsmooth, millerRabinBase2 } from "../primes";

const testMillerRabin = () => {
  assertEq(millerRabinBase2(37n, 9n, 2,), true);
  assertEq(millerRabinBase2(41n, 10n, 2), true);
  assertEq(millerRabinBase2(17n, 1n, 4), true);

  assertEq(millerRabinBase2(33n, 1n, 5), false);
  assertEq(millerRabinBase2(15n, 7n, 1), false);
}

const testGetNonsmooth = () => {
  assertEq(getNonsmooth("14c0657979dc9e9ee4efc484d3ebd0e1b9bac788baa47108d976c0a2c48e7"),
    0x14c0657979dc9e9ee4efc484d3ebd0e1b9bac788baa47108d976c0a2c48e7141n);
}

const testSieve = () => {
  /** @const {!Uint8Array} */
  const t = new Uint8Array(4096);
  for (const p of OddPrimes) {
    /** @type {number} */
    let i = (p - 1) * ((p + 1) >> 1) % p;
    i += p;
    for (; i < 4096; i += p)
      t[i] = 1;
  }

  for (let i = 0; i < 4096; ++i)
    if (!t[i])
      assert(millerRabinBase2(BigInt(2 * i + 1), BigInt(i), 1));
}

testMillerRabin();
testGetNonsmooth();
testSieve();

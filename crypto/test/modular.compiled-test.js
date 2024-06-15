import { assertEq } from "../../testing/assert";
import { exp, exp2, expTimesExp, inverse } from "../modular";

/**
 * Prime used in the secp256k1 curve.
 *
 * @const {!bigint}
 */
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;

const testInverse = () => {
  for (let i = 0; i < 10000; ++i) {
    const n = BigInt(i);
    assertEq(inverse(inverse(n, P), P), n);
  }

  for (let i = 0; i < 10000; ++i) {
    const n = P - BigInt(i) - 1n;
    assertEq(inverse(inverse(n, P), P), n);
  }

  for (let i = 0; i < 10000; ++i) {
    const x = BigInt(i);
    const x2 = (x * x) % P;
    const ix = inverse(x, P);
    const ix2 = (ix * ix) % P;
    assertEq(inverse(x2, P), ix2);
  }

  for (let i = 0; i < 10000; ++i) {
    const x = BigInt(i) + 123123123123n;
    const x3 = (x * x * x) % P;
    const ix = inverse(x, P);
    const ix3 = (ix * ix * ix) % P;
    assertEq(inverse(x3, P), ix3);
  }

  for (let /** !bigint */ p of [3n, 5n, 7n, 11n, P]) {
    assertEq(inverse(1n, p), 1n)
    assertEq(inverse(0n, p), 0n)
    assertEq(inverse(p - 1n, p), p - 1n);
    assertEq(inverse(4n, inverse(p - 1n, p)), inverse(4n, p - 1n))
  }

  assertEq(inverse(0n, P), 0n);
  assertEq(inverse(1n, P), 1n);
  assertEq(inverse(P - 1n, P), P - 1n);
}

const testExp = () => {
  /** @const {!bigint} */
  const Q = 0xDAD19B08F618992D3A5367F0E730B97C6DD113B6A2A493C9EDB0B68DBB1AEC020FB2A64C9644397AB016ABA5B40FA22655060824D9F308984D6734E2439BA08Fn;

  assertEq(exp(0n, 1n, 2n), 0n);
  assertEq(exp(0n, 0n, 2n), 1n);
  assertEq(exp(1n, 0n, 2n), 1n);
  assertEq(exp(1n, 1n, 2n), 1n);
  assertEq(exp(7n, 5n, 11n), 10n);
  assertEq(exp(2n, 5n, 3n), 2n);
  assertEq(exp(9n, 0n, 5n), 1n);

  assertEq(exp(5n, Q - 1n, Q), 1n)
  assertEq(exp(333n, Q - 1n, Q), 1n)
  assertEq(exp(11n, Q - 1n, Q), 1n)

  assertEq(exp(5n, P - 1n, P), 1n)
  assertEq(exp(333n, P - 1n, P), 1n)
  assertEq(exp(11n, P - 1n, P), 1n)

  assertEq(exp(12n, 78n, 131n), 58n);
  assertEq(exp(12n, 38n, 133n), 11n);
}

const testExpTimesExp = () => {
  assertEq(expTimesExp(0n, 1n, 0n, 1n, 2n), 0n);
  assertEq(expTimesExp(0n, 0n, 0n, 0n, 2n), 1n);
  assertEq(expTimesExp(2n, 2n, 3n, 1n, 100n), 12n);
  assertEq(expTimesExp(12n, 38n, 9n, 17n, 133n), 16n);
  assertEq(expTimesExp(12n, 38n, 19n, 17n, 133n), 19n);
  assertEq(expTimesExp(12n, 38n, 55n, 17n, 133n), 80n);
  assertEq(expTimesExp(12n, 38n, 55n, 11231237n, 12938120389123n), 3120026537850n);
  assertEq(expTimesExp(123n, 123n, 456n, 456n, 123456n), 120384n);
}

const testExp2 = () => {
  console.time("testExp2()");
  assertEq(exp2(0n, 3n), exp(2n, 0n, 3n));
  assertEq(exp2(10n, 2000n), exp(2n, 10n, 2000n));
  assertEq(exp2(10n, 11n), exp(2n, 10n, 11n));
  assertEq(exp2(10123n, 1100012n), exp(2n, 10123n, 1100012n));
  console.timeEnd("testExp2()");
}

testInverse();
testExp();
testExpTimesExp();
testExp2();

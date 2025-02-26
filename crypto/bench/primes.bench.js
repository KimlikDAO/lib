import { assert } from "../../testing/assert";
import hex from "../../util/hex";
import { getNonsmooth, millerRabinBase2 } from "../primes";
import { keccak256Uint8 } from "../sha3";

const benchGetNonsmooth = () => {
  console.time("getNonsmooth()");
  /** @type {!Uint8Array} */
  let seed = Uint8Array.from("00000000000000000000000000000123");

  for (let i = 0; i < 1000; ++i) {
    /** @const {bigint} */
    const p = getNonsmooth(hex.from(seed).slice(3));
    assert(millerRabinBase2(p, (p - 1n) >> 1n, 1));
    seed = keccak256Uint8(seed);
  }
  console.timeEnd("getNonsmooth()");
}

benchGetNonsmooth();

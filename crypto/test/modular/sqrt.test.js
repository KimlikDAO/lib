import { describe, expect, test } from "bun:test";
import { sqrt, tonelliShanks } from "../../modular";

describe("tonelliShanks()", () => {
  /** @const {bigint} */
  const P = (1n << 254n) + 0x224698fc094cf91b992d30ed00000001n;
  /** @const {bigint} */
  const c = 0x2bce74deac30ebda362120830561f81aea322bf2b7bb7584bdad6fabd87ea32fn;
  /** @const {(n: bigint) => (bigint | null)} */
  const sqrt = (n) => tonelliShanks(n, P, (P - 1n) >> 32n, c, 32n);
  /** @param {bigint} n */
  const check = (n) => {
    const r = sqrt(n);
    if (r) expect(r * r % P).toBe(n); else expect("f").fail("Non-quadratic residue");
  }
  test("smoke tests", () => {
    check(0x123123123n * 0x123123123n);
    for (let i = 1000n; i < 2000n; ++i)
      check(i * i);
  });
});

describe("P = 101", () => {
  /** @const {bigint} */
  const P = 101n;
  /** @param {bigint} n */
  const check = (n) => {
    const r = sqrt(n, P);
    if (r !== null) expect(r * r % P).toBe(n);
    else expect("f").fail("Non-quadratic residue");
  }

  test("smoke tests", () => {
    check(0n);
    check(1n);
    check(4n);
    check(9n);
    check(16n);
    check(25n);
    check(36n);
    check(49n);
    check(64n);
    check(81n);
    check(100n);
  });

  test("all quadratic residues", () => {
    for (let i = 0n; i < P; ++i)
      check(i * i % P);
  });
});

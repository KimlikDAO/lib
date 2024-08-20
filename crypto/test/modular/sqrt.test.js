import { describe, expect, fail, test } from "bun:test";
import { tonelliShanks } from "../../modular";

describe("tonelliShanks()", () => {
  /** @const {bigint} */
  const P = (1n << 254n) + 0x224698fc094cf91b992d30ed00000001n;
  /** @const {bigint} */
  const c = 0x2bce74deac30ebda362120830561f81aea322bf2b7bb7584bdad6fabd87ea32fn;
  /** @const {function(bigint):?bigint} */
  const sqrt = (n) => tonelliShanks(n, P, (P - 1n) >> 32n, c, 32n);
  /** @param {bigint} n */
  const check = (n) => {
    const r = sqrt(n);
    if (r) expect(r * r % P).toBe(n); else fail();
  }
  test("smoke tests", () => {
    check(0x123123123n * 0x123123123n);
    for (let i = 1000n; i < 2000n; ++i)
      check(i * i);
  });
});

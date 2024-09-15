import { expect, test } from "bun:test";
import { poseidon } from "../minaPoseidon";
import {
  mont,
  mul,
  P,
  unmont
} from "../montgomery";

test("unmont(mont(1)) == 1", () => expect(unmont(mont(1n))).toBe(1n));
test("unmont(mont(1000)) == 1000", () => expect(unmont(mont(1000n))).toBe(1000n));
test("unmont(mont(1000000)) == 1000000", () => expect(unmont(mont(1000000n))).toBe(1000000n));
test("mul(mont(1), mont(1)) == mont(1)", () => expect(unmont(mul(mont(1n), mont(1n)))).toBe(1n));
test("mul(mont(1000), mont(1000)) == mont(1000000)",
  () => expect(unmont(mul(mont(1000n), mont(1000n)))).toBe(1000000n));


test("mul", () => {
  let acc1 = mont(1n);
  let acc2 = 1n;

  for (let i = 1; i < 1000; ++i) {
    const update = poseidon([BigInt(i)]);

    acc1 = mul(acc1, mont(update));
    acc2 = acc2 * update % P;
  }

  expect(unmont(acc1)).toBe(acc2);
});

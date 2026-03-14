import { expect, test } from "bun:test";
import { g } from "../../sha2";
import { f } from "./compression";

test("f(s,t) == g(s,t)", () => {
  const s1 = Uint32Array.from("01234567");
  const t1 = new Uint32Array(64);
  t1[0] = 123; t1[1] = 111;
  f(s1, t1);

  const s2 = Uint32Array.from("01234567");
  const t2 = new Uint32Array(64);
  t2[0] = 123; t2[1] = 111;
  g(s2, t2);

  expect(s1).toEqual(s2);
  expect(t1).toEqual(t2);
});

export { f };

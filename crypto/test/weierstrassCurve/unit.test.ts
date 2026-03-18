import { expect, test } from "bun:test";
import { G } from "./secp192r1";

test("8G == 2·2·2·G", () => {
  const A = G.copy().double().double().double().proj();
  const B = G.copy().multiply(8n).proj();

  expect(A).toEqual(B);
});

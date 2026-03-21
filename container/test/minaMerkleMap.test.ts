import { expect, test } from "bun:test";
import { poseidon } from "../../crypto/minaPoseidon";
import { MinaMerkleMap } from "../minaMerkleMap";

const buildZeros = (height: number): bigint[] => {
  const zeros: bigint[] = Array(height + 1);
  zeros[height] = 0n;
  for (let i = height; i > 0; --i)
    zeros[i - 1] = poseidon([zeros[i], zeros[i]]);
  return zeros;
};

test("set returns previous value and get only returns explicit leaves", () => {
  const map = new MinaMerkleMap(32);

  expect(map.get("F")).toBeUndefined();
  expect(map.set("F", 31n)).toBeUndefined();
  expect(map.get("F")).toBe(31n);
  expect(map.set("F", 69n)).toBe(31n);
  expect(map.get("F")).toBe(69n);
});

test("getInner tracks internal nodes up to the root", () => {
  const map = new MinaMerkleMap(32);
  const fifteen = "0".repeat(28) + "1111";

  map.set("F", 31n);

  expect(map.getInner(fifteen)).toBe(31n);
  expect(map.getInner(fifteen.slice(0, -1)))
    .toBe(poseidon([0n, 31n]));
  expect(map.getInner(fifteen.slice(0, -2)))
    .toBe(poseidon([poseidon([0n, 0n]), poseidon([0n, 31n])]));

  map.set("E", 69n);

  expect(map.getInner(fifteen.slice(0, -1)))
    .toBe(poseidon([69n, 31n]));
  expect(map.getInner(fifteen.slice(0, -2)))
    .toBe(poseidon([poseidon([0n, 0n]), poseidon([69n, 31n])]));
});

test("getWitnessed returns zero root and zero siblings for an absent key", () => {
  const map = new MinaMerkleMap(32);
  const zeros = buildZeros(32);
  const witnessed = map.getWitnessed("00000000");

  expect(witnessed.value).toBeUndefined();
  expect(witnessed.root).toBe(zeros[0]);
  expect(witnessed.witness.map((w) => w.sibling))
    .toEqual(zeros.slice(1).reverse());
});

test("getWitnessed returns current value, root and witness path", () => {
  const zeros = buildZeros(32);
  const map = new MinaMerkleMap(4);
  let witnessed;

  map.set("E", 31n);

  witnessed = map.getWitnessed("F");
  expect(witnessed.value).toBeUndefined();
  expect(witnessed.root).toBe(map.getInner(""));
  expect(witnessed.witness).toEqual([
    { isLeft: false, sibling: 31n },
    { isLeft: false, sibling: zeros[31] },
    { isLeft: false, sibling: zeros[30] },
    { isLeft: false, sibling: zeros[29] }
  ]);

  map.set("D", 30n);

  witnessed = map.getWitnessed("F");
  expect(witnessed.value).toBeUndefined();
  expect(witnessed.root).toBe(map.getInner(""));
  expect(witnessed.witness).toEqual([
    { isLeft: false, sibling: 31n },
    { isLeft: false, sibling: poseidon([0n, 30n]) },
    { isLeft: false, sibling: zeros[30] },
    { isLeft: false, sibling: zeros[29] }
  ]);

  map.set("B", 28n);

  witnessed = map.getWitnessed("F");
  expect(witnessed.value).toBeUndefined();
  expect(witnessed.root).toBe(map.getInner(""));
  expect(witnessed.witness).toEqual([
    { isLeft: false, sibling: 31n },
    { isLeft: false, sibling: poseidon([0n, 30n]) },
    { isLeft: false, sibling: poseidon([zeros[31], poseidon([0n, 28n])]) },
    { isLeft: false, sibling: zeros[29] }
  ]);

  witnessed = map.getWitnessed("E");
  expect(witnessed.value).toBe(31n);
  expect(witnessed.root).toBe(map.getInner(""));
  expect(witnessed.witness).toEqual([
    { isLeft: true, sibling: 0n },
    { isLeft: false, sibling: poseidon([0n, 30n]) },
    { isLeft: false, sibling: poseidon([zeros[31], poseidon([0n, 28n])]) },
    { isLeft: false, sibling: zeros[29] }
  ]);
});

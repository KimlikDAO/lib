import { describe, expect, test } from "bun:test";
import { emit, readTaggedTargets } from "./harness";
import type { TaggedTarget } from "./harness";

type PropertyExpectation = {
  targets: TaggedTarget[];
  outContains?: string[];
  outExcludes?: string[];
};

const expectPropertyOutput = (
  input: string,
  {
    targets,
    outContains = [],
    outExcludes = []
  }: PropertyExpectation
) => (): void => {
  const out = emit(input);
  expect(readTaggedTargets(out)).toEqual(targets);
  for (const fragment of outContains)
    expect(out).toContain(fragment);
  for (const fragment of outExcludes)
    expect(out).not.toContain(fragment);
};

describe("property JSDoc", () => {
  test(
    "field infers generic constructor type",
    expectPropertyOutput(`
class A<K, V> {
  map = new Map<K, V>();
}
`, {
      targets: [
        { tag: "type", type: "Map<K, V>", target: "map = new Map()" }
      ]
    })
  );

  test(
    "explicit field annotation wins over init inference",
    expectPropertyOutput(`
class A<K, V, T> {
  value: T = new Map<K, V>();
}
`, {
      targets: [
        { tag: "type", type: "T", target: "value = new Map()" }
      ]
    })
  );

  test(
    "unsupported initializer emits no empty type block",
    expectPropertyOutput(`
class A {
  x = foo();
}
`, {
      targets: [],
      outContains: ["x = foo();"],
      outExcludes: ["@type {}", "/** @type {"]
    })
  );

  test(
    "interface property keeps explicit type",
    expectPropertyOutput(`
interface Point {
  x: bigint;
}
`, {
      targets: [
        { tag: "type", type: "bigint", target: "x" }
      ]
    })
  );
});

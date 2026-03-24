import { describe, expect, test } from "bun:test";
import { emit, readTaggedTargets } from "./harness";
import type { TaggedTarget } from "./harness";

type PropertyCase = {
  input: string;
  name: string;
  targets: TaggedTarget[];
  outContains?: string[];
  outExcludes?: string[];
};

const expectPropertyOutput = ({
  input,
  targets,
  outContains = [],
  outExcludes = []
}: PropertyCase): void => {
  const out = emit(input);
  expect(readTaggedTargets(out)).toEqual(targets);
  for (const fragment of outContains)
    expect(out).toContain(fragment);
  for (const fragment of outExcludes)
    expect(out).not.toContain(fragment);
};

describe("property JSDoc", () => {
  const cases: PropertyCase[] = [
    {
      name: "field infers generic constructor type",
      input: `
class A<K, V> {
  map = new Map<K, V>();
}
`,
      targets: [
        { tag: "type", type: "Map<K, V>", target: "map = new Map()" }
      ]
    },
    {
      name: "explicit field annotation wins over init inference",
      input: `
class A<K, V, T> {
  value: T = new Map<K, V>();
}
`,
      targets: [
        { tag: "type", type: "T", target: "value = new Map()" }
      ]
    },
    {
      name: "unsupported initializer emits no empty type block",
      input: `
class A {
  x = foo();
}
`,
      targets: [],
      outContains: ["x = foo();"],
      outExcludes: ["@type {}", "/** @type {"]
    },
    {
      name: "interface property keeps explicit type",
      input: `
interface Point {
  x: bigint;
}
`,
      targets: [
        { tag: "type", type: "bigint", target: "x" }
      ]
    }
  ];

  for (const testCase of cases) {
    test(testCase.name, () => {
      expectPropertyOutput(testCase);
    });
  }
});

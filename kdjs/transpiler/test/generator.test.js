import { expect, test } from "bun:test";
import { generateEnum } from "../generator";

test("generateEnum emits number enum with namespace", () => {
  const node = {
    id: { name: "Status" },
    members: [
      { id: { name: "Ok" }, initializer: { value: 0 } },
      { id: { name: "Err" }, initializer: { value: 1 } },
    ],
  };
  const out = generateEnum(node, "ns$$foo");
  expect(out).toBe(
    `/** @enum {number} */
ns$$foo.Status = {
  Ok: 0,
  Err: 1
};
`,
  );
});

test("generateEnum emits string enum and infers @enum {string}", () => {
  const node = {
    id: { name: "Kind" },
    members: [
      { id: { name: "A" }, initializer: { value: "a" } },
      { id: { name: "B" }, initializer: { value: "b" } },
    ],
  };
  const out = generateEnum(node);
  expect(out).toContain("/** @enum {string} */");
  expect(out).toContain('A: "a"');
  expect(out).toContain('B: "b"');
  expect(out).toContain("const Kind = {");
});

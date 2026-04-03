import { expect, test } from "bun:test";
import { stripIndent } from "../source";

test("stripIndent removes the first line indent from every line", (): void => {
  expect(stripIndent(`
    alpha
    beta
  `)).toBe("alpha\nbeta\n");
});

test("stripIndent strictly removes exactly the first line indent width", (): void => {
  expect(stripIndent(`
    alpha
  beta
`)).toBe("alpha\nta\n");
});

test("stripIndent also works without a leading newline", (): void => {
  expect(stripIndent("  alpha\n    beta")).toBe("alpha\n  beta");
});

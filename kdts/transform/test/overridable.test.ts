import { expect, test } from "bun:test";
import { stripIndent } from "../../util/testing/source";
import { transpileOverridables } from "../overridable";

test("transpileOverridables replaces matching overridable initializer", () => {
  expect(transpileOverridables(stripIndent(`
    import { Overridable } from "@kimlikdao/kdts";

    const HOST_URL = "https://example.com" satisfies Overridable;
  `), {
    HOST_URL: "https://override.example",
  })).toBe(stripIndent(`
    import { Overridable } from "@kimlikdao/kdts";

    const HOST_URL = "https://override.example";
  `));
});

test("transpileOverridables preserves type annotations on the declarator", () => {
  expect(transpileOverridables(stripIndent(`
    import { Overridable } from "@kimlikdao/kdts";

    const Config: Record<string, string | number[]> = {} satisfies Overridable;
  `), {
    Config: {
      host: "https://override.example",
      ports: [80, 443],
    },
  })).toBe(stripIndent(`
    import { Overridable } from "@kimlikdao/kdts";

    const Config: Record<string, string | number[]> = {"host":"https://override.example","ports":[80,443]};
  `));
});

test("transpileOverridables only rewrites overridden bindings", () => {
  expect(transpileOverridables(stripIndent(`
    import { Overridable } from "@kimlikdao/kdts";

    const A = 1 satisfies Overridable;
    const B = 2 satisfies Overridable;
  `), {
    B: 3,
  })).toBe(stripIndent(`
    import { Overridable } from "@kimlikdao/kdts";

    const A = 1 satisfies Overridable;
    const B = 3;
  `));
});

test("transpileOverridables ignores non-Overridable satisfies expressions", () => {
  expect(transpileOverridables(stripIndent(`
    const PORT = 80 satisfies number;
  `), {
    PORT: 443,
  })).toBe(stripIndent(`
    const PORT = 80 satisfies number;
  `));
});

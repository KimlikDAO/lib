import { expect, test } from "bun:test";
import { SourceSet } from "../../frontend/sourceSet";
import { ModuleImports } from "../../model/moduleImports";
import { harnessSourceFn } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harnessSourceFn(transpileTs);
const transpile = (src: string) => transpileTs({
  id: "module:test",
  path: "/test.ts"
}, src, new SourceSet(), {}, new ModuleImports());

test("Overridable satisfies uses override JSON with inferred primitive type", () => {
  expectEmit(`
    const Host = "https://example.com" satisfies Overridable;
  `, `
    const Host = /** @type {string} */("https://override.example");
  `, {
    overrides: {
      "Host": "https://override.example"
    }
  });
});

test("Overridable satisfies uses override JSON with explicit object type", () => {
  expectEmit(`
    const Config: Record<string, string | number[]> = {} satisfies Overridable;
  `, `
    /** @const {!Object<string, (string|!Array<number>)>} */
    const Config = /** @type {!Object<string, (string|!Array<number>)>} */({
      "host": "https://override.example",
      "ports": [80, 443]
    });
  `, {
    overrides: {
      "Config": {
        "host": "https://override.example",
        "ports": [80, 443],
      }
    }
  });
});

test("Overridable satisfies uses inferred array type", () => {
  expectEmit(`
    const Ports = [80, 443] satisfies Overridable;
  `, `
    const Ports = /** @type {!Array<number>} */([8080, 8443]);
  `, {
    overrides: {
      "Ports": [8080, 8443]
    }
  });
});

test("Overridable satisfies rejects let declarations", () => {
  expect(() => transpile(`
    let Host = "https://example.com" satisfies Overridable;
  `)).toThrow("Overridable declarations must use const");
});

test("Overridable satisfies rejects var declarations", () => {
  expect(() => transpile(`
    var Host = "https://example.com" satisfies Overridable;
  `)).toThrow("Overridable declarations must use const");
});

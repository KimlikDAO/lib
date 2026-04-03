import { test } from "bun:test";
import { harnessSourceFn } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harnessSourceFn(transpileTs);

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

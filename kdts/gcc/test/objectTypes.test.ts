import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("Object types", () => {
  expectEmit(`
    type User = {
      name: string,
      age: number,
      weight: bigint
    }`, `
    /**
     * @typedef {{
     *   name: string,
     *   age: number,
     *   weight: bigint
     * }}
     */
    const User = {};
  `);
  expectEmit(`
    type User = {
      name?: string,
      age: number | bigint,
      weight?: bigint | "HEAVY"
    }`, `
    /**
     * @typedef {{
     *   name: (string|undefined),
     *   age: (number|bigint),
     *   weight: ((bigint|string)|undefined)
     * }}
     */
    const User = {};
  `);
});

test("Explicitly typed object literal initializers are wrapped with TSAsExpression", () => {
  expectEmit(`
    type User = {
      name: string
    };

    const user: User = {
      name: "Ada"
    };
  `, `
    /**
     * @typedef {{
     *   name: string
     * }}
     */
    const User = {};
    /** @const {!User} */
    const user = /** @type {!User} */({
      name: "Ada"
    });
  `);
});

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

test("Object literal returns are wrapped with the declared return type", () => {
  expectEmit(`
    type User = {
      name: string
    };

    function makeUser(): User {
      return {
        name: "Ada"
      };
    }
  `, `
    /**
     * @typedef {{
     *   name: string
     * }}
     */
    const User = {};
    /**
     * @return {!User}
     */
    function makeUser() {
      return /** @type {!User} */({
        name: "Ada"
      });
    }
  `);
});

test("Concise arrow object literal returns are wrapped with the declared return type", () => {
  expectEmit(`
    type User = {
      name: string
    };

    const makeUser = (): User => ({
      name: "Ada"
    });
  `, `
    /**
     * @typedef {{
     *   name: string
     * }}
     */
    const User = {};
    /**
     * @return {!User}
     */
    const makeUser = () => /** @type {!User} */({
      name: "Ada"
    });
  `);
});

test("Inline object return types are left structural", () => {
  expectEmit(`
    function makeUser(): { name: string } {
      return {
        name: "Ada"
      };
    }
  `, `
    /**
     * @return {{
     *   name: string
     * }}
     */
    function makeUser() {
      return {
        name: "Ada"
      };
    }
  `);
});

test("Async functions do not wrap object literal returns yet", () => {
  expectEmit(`
    type User = {
      name: string
    };

    async function makeUser(): Promise<User> {
      return {
        name: "Ada"
      };
    }
  `, `
    /**
     * @typedef {{
     *   name: string
     * }}
     */
    const User = {};
    /**
     * @return {!Promise<!User>}
     */
    async function makeUser() {
      return {
        name: "Ada"
      };
    }
  `);
});

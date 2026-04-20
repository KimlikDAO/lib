import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("conditional return types lower through TTL", () => {
  expectEmit(`
    declare function pick<T>(x: T): T extends string ? Promise<T[]> : { value: T };`, `
    /**
     * @suppress {reportUnknownTypes}
     * @template T
     * @template RETURN := mapunion(T, (T$0) => cond(sub(T$0, typeExpr("string")), typeExpr("!Promise<!Array<T$0>>"), typeExpr("{ value: T$0 }"))) =:
     * @param {!T} x
     * @return {RETURN}
     */
    function pick(x) {}
  `);
  expectEmit(`
    declare function boxed<T>(x: T): [T] extends [string] ? number : boolean;`, `
    /**
     * @suppress {reportUnknownTypes}
     * @template T
     * @template RETURN := cond(sub(typeExpr("!Array<T>"), typeExpr("!Array<string>")), typeExpr("number"), typeExpr("boolean")) =:
     * @param {!T} x
     * @return {RETURN}
     */
    function boxed(x) {}
  `);
});

test("class template scopes are visible to return TTL", () => {
  expectEmit(`
    class Box<T> {
      pick(x: T): T extends string ? number : boolean {
        throw 0;
      }
    }`, `
    /**
     * @template T
     */
    class Box {
      /**
       * @template RETURN := mapunion(T, (T$0) => cond(sub(T$0, typeExpr("string")), typeExpr("number"), typeExpr("boolean"))) =:
       * @param {!T} x
       * @return {RETURN}
       */
      pick(x) {
        throw 0;
      }
    }
  `);
});

test("return type rendering covers non-closure syntax conservatively", () => {
  expectEmit(`
    declare function lookup<T>(x: T): T["value"];`, `
    /**
     * @suppress {reportUnknownTypes}
     * @template T
     * @param {!T} x
     * @return {!T["value"]}
     */
    function lookup(x) {}
  `);
  expectEmit(`
    declare function remap<T>(x: T): { [K in keyof T]: T[K] };`, `
    /**
     * @suppress {reportUnknownTypes}
     * @template T
     * @param {!T} x
     * @return {Object}
     */
    function remap(x) {}
  `);
  expectEmit(`
    declare function isUser<T>(x: T): x is { id: string };`, `
    /**
     * @suppress {reportUnknownTypes}
     * @template T
     * @param {!T} x
     * @return {boolean}
     */
    function isUser(x) {}
  `);
  expectEmit(`
    declare function either<T>(x: T): T & { ok: boolean };`, `
    /**
     * @suppress {reportUnknownTypes}
     * @template T
     * @param {!T} x
     * @return {?}
     */
    function either(x) {}
  `);
  expectEmit(`
    declare function inferIt<T>(x: T): T extends Promise<infer U> ? U : never;`, `
    /**
     * @suppress {reportUnknownTypes}
     * @template T
     * @template RETURN := unknown() =:
     * @param {!T} x
     * @return {RETURN}
     */
    function inferIt(x) {}
  `);
});

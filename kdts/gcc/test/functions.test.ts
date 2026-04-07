import { describe, test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

describe("FunctionType", () => {
  test("w / wo optional params", () => {
    expectEmit(`
      type CurveChecker = (x: bigint, y: bigint, z: bigint) => boolean`, `
      /**
       * @typedef {function(bigint,bigint,bigint):boolean}
       */
      const CurveChecker = {};
    `);

    expectEmit(`
      type CurveChecker = (x: bigint, y: bigint, z?: bigint) => boolean | undefined`, `
      /**
       * @typedef {function(bigint,bigint,bigint=):(boolean|undefined)}
       */
      const CurveChecker = {};
    `);
  });
});

describe("ArrowFunctionExpression", () => {
  test("function declaration", () => {
    expectEmit(`
      const f = (a: string, b: number): string | number => {}
      `, `
      /**
       * @param {string} a
       * @param {number} b
       * @return {(string|number)}
       */
      const f = (a, b) => {};
    `);

    expectEmit(`
      const f = (a: string, b?: number): bigint => {}`, `
      /**
       * @param {string} a
       * @param {number=} b
       * @return {bigint}
       */
      const f = (a, b) => {};
    `);

    expectEmit(`
      const g = (a: bigint, c = 2): Flab => {}`, `
      /**
       * @param {bigint} a
       * @param {number=} c
       * @return {!Flab}
       */
      const g = (a, c = 2) => {};
    `);

    expectEmit(`
      const g = (a: bigint, c = new Map<string, string>()): Flab => {}`, `
      /**
       * @param {bigint} a
       * @param {!Map<string, string>=} c
       * @return {!Flab}
       */
      const g = (a, c = new Map()) => {};
    `);
  });

  test("rest parameters", () => {
    expectEmit(`
      const g = (a: bigint, ...b: Type[]): void => {}`, `
      /**
       * @param {bigint} a
       * @param {...!Type} b
       * @return {void}
       */
      const g = (a, ...b) => {};
    `);
  });
});

describe("FunctionExpression", () => {
  test("validator", () => {
    expectEmit(`
      /** @satisfies {PureFn} */
      const validate = function(
        data: Uint8Array,
        signature: { r: bigint, s: bigint, yParity: boolean }
      ): boolean {}
    `, `
      /**
       * @nosideeffects
       * @param {!Uint8Array} data
       * @param {{
       *   r: bigint,
       *   s: bigint,
       *   yParity: boolean
       * }} signature
       * @return {boolean}
       */
      const validate = function (data, signature) {};
    `);
  });
});

describe("FunctionDeclaration", ()=>{
  test("validator", () => {
    expectEmit(`
      function validate(data: Uint8Array, signature: { r: bigint, s: bigint }): boolean {} 
    `, `
      /**
       * @param {!Uint8Array} data
       * @param {{
       *   r: bigint,
       *   s: bigint
       * }} signature
       * @return {boolean}
       */
      function validate(data, signature) {}
    `);
  });
});

import { describe, expect, test } from "bun:test";
import { emit, stripIndent } from "./harness";

describe("interfaces", () => {
  test("simple interface emits fields and methods", () => {
    const input = stripIndent(`
      interface Point {
        x: bigint;
        y: bigint;
        copy(): Point;
        increment(other: Point): Point;
      }
    `);

    expect(emit(input)).toBe(stripIndent(`
      /**
       * @interface
       */
      class Point {
        /** @type {bigint} */
        x;
        /** @type {bigint} */
        y;
        /**
         * @return {Point}
         */
        copy() {}
        /**
         * @param {Point} other
         * @return {Point}
         */
        increment(other) {}
      }
    `));
  });

  test("typedef, extends, callback param, and optional param stay compact", () => {
    const input = stripIndent(`
      type Provider = MinaProvider | EthereumProvider;

      interface Connector extends Signer {
        connect(
          chain: ChainId,
          changed: (chainId: ChainId) => void,
          onlyIfApproved?: boolean
        ): Promise<void> | void;
      }

      export { Provider, Connector };
    `);

    expect(emit(input)).toBe(stripIndent(`
      /**
       * @typedef {MinaProvider | EthereumProvider}
       */
      const Provider = {};
      /**
       * @interface
       * @extends {Signer}
       */
      class Connector {
        /**
         * @param {ChainId} chain
         * @param {(chainId: ChainId) => void} changed
         * @param {boolean=} onlyIfApproved
         * @return {Promise<void> | void}
         */
        connect(chain, changed, onlyIfApproved) {}
      }

      export { Provider, Connector };
    `));
  });
});

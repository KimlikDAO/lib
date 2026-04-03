import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("interfaces", () => {
  expectEmit(`
    interface Point {
      x: bigint;
      y: bigint;
      copy(): Point;
      increment(other: Point): Point;
    }`, `
    /**
     * @interface
     */
    class Point {
      /** @type {bigint} */
      x;
      /** @type {bigint} */
      y;
      /**
       * @return {!Point}
       */
      copy() {}
      /**
       * @param {!Point} other
       * @return {!Point}
       */
      increment(other) {}
    }
  `);
  expectEmit(`
    type Provider = MinaProvider | EthereumProvider;

    interface Connector extends Signer {
      connect(
        chain: ChainId,
        changed: (chainId: ChainId) => void,
        onlyIfApproved?: boolean
      ): Promise<void> | void;
    }
  `, `
    /**
     * @typedef {(!MinaProvider|!EthereumProvider)}
     */
    const Provider = {};
    /**
     * @interface
     * @extends {Signer}
     */
    class Connector {
      /**
       * @param {!ChainId} chain
       * @param {function(!ChainId):void} changed
       * @param {boolean=} onlyIfApproved
       * @return {(!Promise<void>|void)}
       */
      connect(chain, changed, onlyIfApproved) {}
    }
  `);

  expectEmit(`
    interface Box<T> extends ReadonlyArray<T> {}`, `
    /**
     * @interface
     * @extends {ReadonlyArray<!T>}
     * @template T
     */
    class Box {}
  `);
});

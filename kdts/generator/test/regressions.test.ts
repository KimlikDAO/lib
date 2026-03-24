import { describe, expect, test } from "bun:test";
import { emit, stripIndent } from "./harness";

describe("regressions", () => {
  test("returned class keeps implements and parameter properties", () => {
    const input = stripIndent(`
      interface Point {
        copy(): Point;
      }

      /**
       * @pure
       */
      const makePoint = (): PointCtor => {
        return class PointImpl implements Point {
          constructor(public x: bigint, public y: bigint = 1n) {}

          /**
           * @pure
           */
          copy(): Point {
            return new PointImpl(this.x, this.y);
          }
        };
      };
    `);

    expect(emit(input)).toBe(stripIndent(`
      /**
       * @interface
       */
      class Point {
        /**
         * @return {Point}
         */
        copy() {}
      }
      /**
       * @nosideeffects
       * @return {PointCtor}
       */
      const makePoint = () => {
        return (
          /**
           * @implements {Point}
           */
          class PointImpl {
            /**
             * @param {bigint} x
             * @param {bigint=} y
             */
            constructor(x, y = 1n) {
              /** @type {bigint} */
              this.x = x;
              /** @type {bigint} */
              this.y = y;
            }
            /**
             * @nosideeffects
             * @return {Point}
             */
            copy() {
              return new PointImpl(this.x, this.y);
            }
          });
      };
    `));
  });

  test("implemented class keeps parameter property and casted request args", () => {
    const input = stripIndent(`
      interface Provider {
        read(tx: Tx): Promise<string>;
      }

      class RemoteProvider implements Provider {
        constructor(
          readonly request: (params: RequestArguments) => Promise<unknown>
        ) {}

        read(tx: Tx): Promise<string> {
          return this.request({ tx } as RequestArguments) as Promise<string>;
        }
      }
    `);

    expect(emit(input)).toBe(stripIndent(`
      /**
       * @interface
       */
      class Provider {
        /**
         * @param {Tx} tx
         * @return {Promise<string>}
         */
        read(tx) {}
      }
      /**
       * @implements {Provider}
       */
      class RemoteProvider {
        /**
         * @param {(params: RequestArguments) => Promise<unknown>} request
         */
        constructor(request) {
          /** @const {(params: RequestArguments) => Promise<unknown>} */
          this.request = request;
        }
        /**
         * @param {Tx} tx
         * @return {Promise<string>}
         */
        read(tx) {
          return /** @type {Promise<string>} */(this.request(/** @type {RequestArguments} */({
            tx
          })));
        }
      }
    `));
  });
});

import { describe, expect, test } from "bun:test";
import { emitFirst, stripIndent } from "./harness";

const expectExport = (input: string, expected: string) => (): void => {
  expect(emitFirst(input)).toBe(stripIndent(expected));
};

describe("direct exports", () => {
  test.failing(
    "exported typed const emits declaration then named export",
    expectExport("export const x: number = 1;", `/** @const {number} */
const x = 1;
export { x };`)
  );

  test.failing(
    "exported function emits declaration then named export",
    expectExport("export function f(x: number) {}", `/**
 * @param {number} x
 */
function f(x) {
}
export { f };`)
  );

  test.failing(
    "exported class emits declaration then named export",
    expectExport("export class A {}", `class A {
}
export { A };`)
  );

  test.failing(
    "exported interface emits declaration then named export",
    expectExport("export interface Point { x: bigint; }", `/**
 * @interface
 */
class Point {
  /** @type {bigint} */
  x;
}
export { Point };`)
  );
});

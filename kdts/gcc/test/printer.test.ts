import { describe, expect, test } from "bun:test";
import { emit, stripIndent } from "./harness";

const expectPrinted = (input: string, expected: string) => (): void => {
  expect(emit(input)).toBe(expected);
};

describe("printer", () => {
  test("typeof expression", expectPrinted("typeof true;", "typeof true;\n"));
  test("void expression", expectPrinted("void 0;", "void 0;\n"));

  test(
    "member expression wraps assignment object",
    expectPrinted(
      "(hashToSections[h] ||= []).push(decryptedSections[key]);",
      "(hashToSections[h] ||= []).push(decryptedSections[key]);\n"
    )
  );

  test(
    "for with expression init emits one semicolon before test",
    expectPrinted("for (i = 0; i < 10; i++) {}", "for (i = 0; (i < 10); i++) {\n}\n")
  );

  test(
    "for with variable declaration init emits one semicolon before test",
    expectPrinted(
      "for (let i = 0; i < 10; i++) {}",
      "for (let i = 0; (i < 10); i++) {\n}\n"
    )
  );

  test("noinline typed variable keeps block JSDoc before while loop", () => {
    const input = stripIndent(`
      /** @noinline */
      let i: number = 0;
      while (i < 3) {
        i++;
      }
    `);

    expect(emit(input)).toBe(stripIndent(`
      /**
       * @noinline
       * @type {number}
       */
      let i = 0;
      while ((i < 3)) {
        i++;
      }
    `));
  });

  test("IIFE arrow gets wrapped before invocation", () => {
    const input = stripIndent(`
      const fromUint8: readonly string[] = (
        (): string[] => {
          const arr: string[] = [];
          return arr;
        })();
    `);

    expect(emit(input)).toBe(stripIndent(`
      /** @const {readonly string[]} */
      const fromUint8 = (/** @return {string[]} */ () => {
        /** @const {string[]} */
        const arr = [];
        return arr;
      })();
    `));
  });
});

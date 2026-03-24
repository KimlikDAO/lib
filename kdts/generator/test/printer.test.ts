import { describe, expect, test } from "bun:test";
import { emit, stripIndent } from "./harness";

describe("printer", () => {
  const exactCases = [
    {
      name: "typeof expression",
      input: "typeof true;",
      expected: "typeof true;\n"
    },
    {
      name: "void expression",
      input: "void 0;",
      expected: "void 0;\n"
    },
    {
      name: "member expression wraps assignment object",
      input: "(hashToSections[h] ||= []).push(decryptedSections[key]);",
      expected: "(hashToSections[h] ||= []).push(decryptedSections[key]);\n"
    },
    {
      name: "for with expression init emits one semicolon before test",
      input: "for (i = 0; i < 10; i++) {}",
      expected: "for (i = 0; (i < 10); i++) {\n}\n"
    },
    {
      name: "for with variable declaration init emits one semicolon before test",
      input: "for (let i = 0; i < 10; i++) {}",
      expected: "for (let i = 0; (i < 10); i++) {\n}\n"
    }
  ];

  for (const { name, input, expected } of exactCases) {
    test(name, () => {
      expect(emit(input)).toBe(expected);
    });
  }

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

import { expect, test } from "bun:test";
import { transpileKdjs } from "../kdjs";

test("removes imports used only from jsdoc", () => {
  const input = `import { Foo } from "./types";
/** @type {Foo} */
const value = 1;
`;

  expect(transpileKdjs(input)).toBe(`/** @type {Foo} */
const value = 1;
`);
});

test("prunes only the type-only specifiers", () => {
  const input = `import Foo, { Bar, Baz as LocalBaz } from "./types";
/** @type {Foo} */
const value = LocalBaz;
`;

  expect(transpileKdjs(input)).toBe(`import{Baz as LocalBaz} from"./types";
/** @type {Foo} */
const value = LocalBaz;
`);
});

test("keeps imported names referenced from export specifiers", () => {
  const input = `import { Foo, Bar } from "./types";
export { Foo as ExportedFoo };
/** @type {Bar} */
const value = 1;
`;

  expect(transpileKdjs(input)).toBe(`import{Foo} from"./types";
export { Foo as ExportedFoo };
/** @type {Bar} */
const value = 1;
`);
});

test("drops imports shadowed by a later declaration in the same block", () => {
  const input = `import { Foo } from "./types";
{
  console.log(Foo);
  let Foo = 1;
}
`;

  expect(transpileKdjs(input)).toBe(`{
  console.log(Foo);
  let Foo = 1;
}
`);
});

test("keeps shorthand object property references", () => {
  const input = `import { Foo } from "./types";
const value = { Foo };
`;

  expect(transpileKdjs(input)).toBe(input);
});

test("keeps namespace imports used at runtime", () => {
  const input = `import * as ns from "./types";
const value = ns.answer;
`;

  expect(transpileKdjs(input)).toBe(input);
});

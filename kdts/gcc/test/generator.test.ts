import { expect, test } from "bun:test";
import { parse } from "acorn";
import { generateAliasImports, generateEsmImports } from "../generator";
import { ModuleImports } from "../../model/moduleImport";

const getImports = (code: string, source?: string): ModuleImports => {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const imports = new ModuleImports();
  for (const node of ast.body)
    if (node.type == "ImportDeclaration")
      imports.add(node, source as `package:${string}` | `module:${string}` | undefined);
  return imports;
};

test("generateEsmImports dedupes fan-out by imported name", () => {
  const imports = getImports(`
    import { a as b } from "d";
    import { a as c, d } from "d";
  `);

  expect(generateEsmImports(imports)).toBe(
    'import { a as kdts$$module$d$a, d as kdts$$module$d$d } from "d";\n'
  );
  expect(generateAliasImports(imports)).toBe(`/** @const */
const b = kdts$$module$d$a;
/** @const */
const c = kdts$$module$d$a;
/** @const */
const d = kdts$$module$d$d;
`);
});

test("generateEsmImports handles default and named imports", () => {
  const imports = getImports(
    'import Foo, { baz, bar } from "pkg";',
    "package:pkg"
  );

  expect(generateEsmImports(imports)).toBe(
    'import kdts$$package$pkg$default, { bar as kdts$$package$pkg$bar, baz as kdts$$package$pkg$baz } from "pkg";\n'
  );
});

test("generateEsmImports splits namespace and named imports for one source", () => {
  const imports = getImports(`
    import * as ns from "d";
    import { a } from "d";
  `);

  expect(generateEsmImports(imports)).toBe(
    'import * as kdts$$module$d$star from "d";\n'
    + 'import { a as kdts$$module$d$a } from "d";\n'
  );
});

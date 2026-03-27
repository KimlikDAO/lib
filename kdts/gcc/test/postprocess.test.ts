import { expect, test } from "bun:test";
import { parse } from "acorn";
import { ModuleImports } from "../../model/moduleImport";
import { postprocess } from "../postprocess";

const getImports = (code: string): ModuleImports => {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const imports = new ModuleImports();

  for (const node of ast.body)
    if (node.type == "ImportDeclaration")
      imports.add(node);

  return imports;
};

test("postprocess prepends generated ESM imports for unlinked bindings", () => {
  const result = postprocess(
    "const localName = kdts$$module$a$b$c$ImportedName;\n",
    getImports('import { ImportedName as localName } from "a/b/c";')
  );

  expect(result).toBe(
    'import { ImportedName as kdts$$module$a$b$c$ImportedName } from "a/b/c";\n'
    + "const localName = kdts$$module$a$b$c$ImportedName;\n"
  );
});

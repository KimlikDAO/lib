import { expect, test } from "bun:test";
import { ModuleImports } from "../modules";

test("stores imports in a singular map keyed by local name", (): void => {
  const imports = new ModuleImports()
    .add("Type1", "src/types/myFile.d.ts", "Type1")
    .add("Type2", "src/types/myFile.d.ts", "Type2");

  expect(imports.byLocal).toEqual({
    "Type1": { source: "src/types/myFile.d.ts", importedName: "Type1" },
    "Type2": { source: "src/types/myFile.d.ts", importedName: "Type2" },
  });
});

test("replaces existing local binding when added again", (): void => {
  const imports = new ModuleImports()
    .add("parse", "acorn", "parse")
    .add("parse", "acorn", "Parser");

  expect(imports.byLocal).toEqual({
    "parse": { source: "acorn", importedName: "Parser" },
  });
});

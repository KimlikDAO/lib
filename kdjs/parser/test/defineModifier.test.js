import { expect, test } from "bun:test";
import { Modifier } from "../../types/modifier";
import { parseSource } from "./utils";

test("VariableDeclaration has modifiers from preceding JSDoc @define", () => {
  const ast = parseSource(`/** @define */
const N = 100;
`);
  expect(ast.type).toBe("Program");
  expect(ast.body.length).toBe(1);
  const stmt = ast.body[0];
  expect(stmt.type).toBe("VariableDeclaration");
  expect(stmt.kind).toBe("const");
  expect(stmt.declarations.length).toBe(1);
  expect(stmt.declarations[0].id.name).toBe("N");
  expect(stmt.declarations[0].init.type).toBe("Literal");
  expect(stmt.declarations[0].init.value).toBe(100);
  expect(stmt.modifiers).toBe(Modifier.Define);
});

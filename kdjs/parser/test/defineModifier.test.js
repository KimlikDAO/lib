import { expect, test } from "bun:test";
import { Modifier } from "../../types/modifier";
import { parseSource } from "./utils";

test("VariableDeclaration has modifiers from preceding JSDoc @define", () => {
  const ast = parseSource(`/** @define */
const N: number = 100;
/** @define */
const M: number = 200;
`);
  expect(ast.type).toBe("Program");
  expect(ast.body.length).toBe(2);

  const stmtN = ast.body[0];
  expect(stmtN.type).toBe("VariableDeclaration");
  expect(stmtN.kind).toBe("const");
  expect(stmtN.declarations.length).toBe(1);
  expect(stmtN.declarations[0].id.name).toBe("N");
  expect(stmtN.declarations[0].init.type).toBe("Literal");
  expect(stmtN.declarations[0].init.value).toBe(100);
  expect(stmtN.modifiers).toBe(Modifier.Define);

  const stmtM = ast.body[1];
  expect(stmtM.type).toBe("VariableDeclaration");
  expect(stmtM.kind).toBe("const");
  expect(stmtM.declarations.length).toBe(1);
  expect(stmtM.declarations[0].id.name).toBe("M");
  expect(stmtM.declarations[0].init.type).toBe("Literal");
  expect(stmtM.declarations[0].init.value).toBe(200);
  expect(stmtM.modifiers).toBe(Modifier.Define);
});

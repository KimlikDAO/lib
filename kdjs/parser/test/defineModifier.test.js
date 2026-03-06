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

test("modifier from JSDoc attaches to statement-level VariableDeclaration, not nested one", () => {
  const ast = parseSource(`
/** @pure */
const triple = (x: bigint): bigint => {
  /** @pure */
  const double = (x: bigint): bigint => x + x;
  const xx = double(x);
  return xx + x;
};
`);
  const stmt = ast.body[0];
  expect(stmt.type).toBe("VariableDeclaration");
  expect(stmt.declarations[0].id.name).toBe("triple");
  expect(stmt.modifiers).toBe(Modifier.Pure);
  const innerBlock = stmt.declarations[0].init.body.body;
  const doubleDecl = innerBlock[0];
  expect(doubleDecl.type).toBe("VariableDeclaration");
  expect(doubleDecl.declarations[0].id.name).toBe("double");
  expect(doubleDecl.modifiers).toBe(Modifier.Pure);
});
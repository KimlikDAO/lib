import { expect, test } from "bun:test";
import { Modifier } from "../../types/modifier";
import { parseSource } from "./utils";

test("VariableDeclaration has modifiers from preceding JSDoc @define", () => {
  const ast = parseSource(`
/** @define */
const N: number = 100;
/** @define */
const M: number = 200;
`);
  const stmtN = ast.body[0];
  expect(stmtN.type).toBe("VariableDeclaration");
  expect(stmtN.kind).toBe("const");
  expect(stmtN.modifiers).toBe(Modifier.Define);

  const stmtM = ast.body[1];
  expect(stmtM.type).toBe("VariableDeclaration");
  expect(stmtM.kind).toBe("const");
  expect(stmtM.modifiers).toBe(Modifier.Define);
});

test("@noinline", () => {
  const ast = parseSource(`
import { PureExpr } from "../kdjs/kdjs.d";
import bigints from "../util/bigints";
import { arfCurve } from "./arfCurve";
import { Point as IPoint, aX_bY } from "./ellipticCurve";
import { inverse } from "./modular";

/** @noinline */
const P = (1n << 256n) - (1n << 32n) - 977n;
/** @noinline */
const Q = P - 0x14551231950b75fc4402da1722fc9baeen;

type Curve = new (x: bigint, y: bigint, z?: bigint) => IPoint;
const Point: Curve = arfCurve(P);

/** @pure */
const tower = (b: bigint, pow: number): bigint => {
  while (pow-- > 0)
    b = b * b % P;
  return b;
}
`);
  const stmtN = ast.body[5];
  expect(stmtN.type).toBe("VariableDeclaration");
  expect(stmtN.kind).toBe("const");
  expect(stmtN.declarations[0].id.name).toBe("P");
  expect(stmtN.modifiers).toBe(Modifier.NoInline);

  const stmtM = ast.body[6];
  expect(stmtM.type).toBe("VariableDeclaration");
  expect(stmtM.kind).toBe("const");
  expect(stmtM.declarations[0].id.name).toBe("Q");
  expect(stmtM.modifiers).toBe(Modifier.NoInline);
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
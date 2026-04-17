import { expect, test } from "bun:test";
import { Modifier } from "../../model/modifier";
import { modifiersFromJsDoc } from "../jsdocParser";
import { parseSource } from "./utils";

test("modifier from JSDoc attaches to statement-level VariableDeclaration, not nested one", () => {
  const ast = parseSource(`
    /** @satisfies {PureFn} */
    const triple = (x: bigint): bigint => {
      /** @satisfies {PureFn} */
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

test("Function modifiers attach on ArrowFunctionExpressions", () => {
  const ast = parseSource(`
    f(P, /** @satisfies {PureFn} */ () => {});
  `);
  const stmt = ast.body[0];
  expect(stmt.type).toBe("ExpressionStatement");
  const call = stmt.expression;
  expect(call.type).toBe("CallExpression");
  const innerFn = call.arguments[1];
  expect(innerFn.type).toBe("ArrowFunctionExpression");
  expect(innerFn.modifiers).toBe(Modifier.Pure);
});

test("modifiersFromJsDoc ORs @satisfies entries and ignores unknown modifiers", () => {
  const modifiers = modifiersFromJsDoc(`
    * @satisfies {DeterministicFn & InlineFn & UnknownFn}
    * @satisfies {InlineFriendlyFn}
  `);

  expect(modifiers).toBe(
    Modifier.Deterministic | Modifier.Inline | Modifier.InlineFriendly
  );
});

test("Inline modifiers attach on FunctionDeclarations", () => {
  const ast = parseSource(`
    /** @satisfies {InlineFn} */
    function arr<T>(x: T[] | T): T[] {
      return Array.isArray(x) ? x : [x];
    }
  `);
  const stmt = ast.body[0];
  expect(stmt.type).toBe("FunctionDeclaration");
  expect(stmt.id.name).toBe("arr");
  expect(stmt.modifiers).toBe(Modifier.Inline);
});

test("multiple @satisfies tags accumulate on the parsed node", () => {
  const ast = parseSource(`
    /**
     * @satisfies {DeterministicFn & InlineFn}
     * @satisfies {InlineFriendlyFn & UnknownFn}
     */
    const run = () => 1;
  `);
  const stmt = ast.body[0];
  expect(stmt.type).toBe("VariableDeclaration");
  expect(stmt.modifiers).toBe(
    Modifier.Deterministic | Modifier.Inline | Modifier.InlineFriendly
  );
});

test("Function modifiers attach on parenthesized destructuring ArrowFunctionExpressions", () => {
  const ast = parseSource(`
    f(
      /** @satisfies {PureFn} */
      ({ x, yParity }: CompressedPoint): Point | null => {}
    );
  `);
  const stmt = ast.body[0];
  expect(stmt.type).toBe("ExpressionStatement");
  const call = stmt.expression;
  expect(call.type).toBe("CallExpression");
  const innerFn = call.arguments[0];
  expect(innerFn.type).toBe("ArrowFunctionExpression");
  expect(innerFn.modifiers).toBe(Modifier.Pure);
  expect(innerFn.params[0].type).toBe("ObjectPattern");
  expect(innerFn.params[0].modifiers).toBeUndefined();
});

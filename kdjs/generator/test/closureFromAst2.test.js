/**
 * Tests for closureFromAst2 generateExpression (and generate) entry point.
 * Structure mirrors the spec: expression-only tests here; statement/program tests later.
 */
import { expect, test } from "bun:test";
import {
  generate,
  generateExpression,
  generateStatement,
  generateTypeExpr,
} from "../closureFromAst2";

test("generateExpression Identifier", () => {
  expect(generateExpression({ type: "Identifier", name: "foo" })).toBe("foo");
});

test("generateExpression Literal number", () => {
  expect(generateExpression({ type: "Literal", value: 42 })).toBe("42");
});

test("generateExpression Literal string", () => {
  expect(generateExpression({ type: "Literal", value: "hello" })).toBe('"hello"');
});

test("generateExpression Literal null", () => {
  expect(generateExpression({ type: "Literal", value: null })).toBe("null");
});

test("generateExpression Literal boolean", () => {
  expect(generateExpression({ type: "Literal", value: true })).toBe("true");
  expect(generateExpression({ type: "Literal", value: false })).toBe("false");
});

test("generateExpression ThisExpression", () => {
  expect(generateExpression({ type: "ThisExpression" })).toBe("this");
});

test("generateExpression BinaryExpression", () => {
  const node = {
    type: "BinaryExpression",
    operator: "+",
    left: { type: "Identifier", name: "a" },
    right: { type: "Identifier", name: "b" },
  };
  expect(generateExpression(node)).toBe("a + b");
});

test("generateExpression LogicalExpression", () => {
  const node = {
    type: "LogicalExpression",
    operator: "&&",
    left: { type: "Identifier", name: "x" },
    right: { type: "Identifier", name: "y" },
  };
  expect(generateExpression(node)).toBe("x && y");
});

test("generateExpression CallExpression", () => {
  const node = {
    type: "CallExpression",
    callee: { type: "Identifier", name: "f" },
    arguments: [
      { type: "Literal", value: 1 },
      { type: "Identifier", name: "x" },
    ],
  };
  expect(generateExpression(node)).toBe("f(1, x)");
});

test("generateExpression MemberExpression dot", () => {
  const node = {
    type: "MemberExpression",
    object: { type: "Identifier", name: "obj" },
    property: { type: "Identifier", name: "prop" },
    computed: false,
  };
  expect(generateExpression(node)).toBe("obj.prop");
});

test("generateExpression MemberExpression computed", () => {
  const node = {
    type: "MemberExpression",
    object: { type: "Identifier", name: "arr" },
    property: { type: "Identifier", name: "i" },
    computed: true,
  };
  expect(generateExpression(node)).toBe("arr[i]");
});

test("generateExpression NewExpression", () => {
  const node = {
    type: "NewExpression",
    callee: { type: "Identifier", name: "Uint8Array" },
    arguments: [{ type: "Literal", value: 8 }],
  };
  expect(generateExpression(node)).toBe("new Uint8Array(8)");
});

test("generateExpression ConditionalExpression", () => {
  const node = {
    type: "ConditionalExpression",
    test: { type: "Identifier", name: "flag" },
    consequent: { type: "Literal", value: 1 },
    alternate: { type: "Literal", value: 0 },
  };
  expect(generateExpression(node)).toBe("flag ? 1 : 0");
});

test("generateExpression SequenceExpression", () => {
  const node = {
    type: "SequenceExpression",
    expressions: [
      { type: "Identifier", name: "a" },
      { type: "Identifier", name: "b" },
    ],
  };
  expect(generateExpression(node)).toBe("(a, b)");
});

test("generateExpression ObjectExpression", () => {
  const node = {
    type: "ObjectExpression",
    properties: [
      {
        type: "Property",
        key: { type: "Identifier", name: "x" },
        value: { type: "Literal", value: 1 },
        shorthand: false,
      },
      {
        type: "Property",
        key: { type: "Identifier", name: "y" },
        value: { type: "Identifier", name: "y" },
        shorthand: true,
      },
    ],
  };
  expect(generateExpression(node)).toBe("{ x: 1, y }");
});

test("generateExpression ArrayExpression", () => {
  const node = {
    type: "ArrayExpression",
    elements: [
      { type: "Literal", value: 1 },
      { type: "Literal", value: 2 },
      null,
      { type: "Identifier", name: "rest" },
    ],
  };
  expect(generateExpression(node)).toBe("[1, 2, , rest]");
});

test("generateExpression TSAsExpression", () => {
  const node = {
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "x" },
    typeAnnotation: {
      typeAnnotation: { type: "TSNumberKeyword" },
    },
  };
  expect(generateExpression(node)).toBe("/** @type {number} */(x)");
});

test("generateExpression TSTypeAssertion", () => {
  const node = {
    type: "TSTypeAssertion",
    expression: { type: "Identifier", name: "id" },
    typeAnnotation: {
      typeAnnotation: { type: "TSStringKeyword" },
    },
  };
  expect(generateExpression(node)).toBe('/** @type {string} */(id)');
});

test("generateExpression ArrayPattern", () => {
  const node = {
    type: "ArrayPattern",
    elements: [
      { type: "Identifier", name: "a" },
      { type: "Identifier", name: "b" },
      { type: "RestElement", argument: { type: "Identifier", name: "rest" } },
    ],
  };
  expect(generateExpression(node)).toBe("[a, b, ...rest]");
});

test("generateExpression ObjectPattern", () => {
  const node = {
    type: "ObjectPattern",
    properties: [
      {
        type: "Property",
        key: { type: "Identifier", name: "a" },
        value: { type: "Identifier", name: "a" },
        shorthand: true,
      },
      {
        type: "Property",
        key: { type: "Identifier", name: "b" },
        value: { type: "Identifier", name: "b" },
        shorthand: true,
      },
    ],
  };
  expect(generateExpression(node)).toBe("{ a, b }");
});

test("generateExpression with context.typeMap", () => {
  const node = {
    type: "TSAsExpression",
    expression: { type: "Identifier", name: "ChainId" },
    typeAnnotation: {
      typeAnnotation: { type: "Identifier", name: "ChainId" },
    },
  };
  const typeMap = new Map([["ChainId", "ns$$chains.ChainId"]]);
  expect(generateExpression(node, { typeMap })).toBe(
    "/** @type {ns$$chains.ChainId} */(ChainId)"
  );
});

test("generateExpression TemplateLiteral", () => {
  const node = {
    type: "TemplateLiteral",
    quasis: [
      { value: { raw: "hello " } },
      { value: { raw: "" } },
    ],
    expressions: [{ type: "Identifier", name: "name" }],
  };
  expect(generateExpression(node)).toBe("`hello ${name}`");
});

test("generateExpression UnaryExpression", () => {
  const node = {
    type: "UnaryExpression",
    operator: "!",
    prefix: true,
    argument: { type: "Identifier", name: "x" },
  };
  expect(generateExpression(node)).toBe("!x");
});

test("generateExpression UpdateExpression", () => {
  const node = {
    type: "UpdateExpression",
    operator: "++",
    prefix: true,
    argument: { type: "Identifier", name: "i" },
  };
  expect(generateExpression(node)).toBe("++i");
});

test("generateExpression AssignmentExpression", () => {
  const node = {
    type: "AssignmentExpression",
    operator: "=",
    left: { type: "Identifier", name: "x" },
    right: { type: "Literal", value: 0 },
  };
  expect(generateExpression(node)).toBe("x = 0");
});

test("generateExpression unsupported type throws", () => {
  expect(() =>
    generateExpression({ type: "MetaProperty", meta: { name: "import" }, property: { name: "meta" } })
  ).toThrow("Unsupported expression type: MetaProperty");
});

test("generateTypeExpr exported", () => {
  expect(generateTypeExpr({ type: "TSNumberKeyword" })).toBe("number");
  expect(generateTypeExpr({ type: "TSUnionType", types: [{ type: "TSStringKeyword" }, { type: "TSNumberKeyword" }] })).toBe("string|number");
});

// --- generateStatement ---
test("generateStatement VariableDeclaration", () => {
  const node = {
    type: "VariableDeclaration",
    kind: "const",
    declarations: [
      { type: "VariableDeclarator", id: { type: "Identifier", name: "x" }, init: { type: "Literal", value: 1 } },
    ],
  };
  expect(generateStatement(node)).toBe("const x = 1;");
});

test("generateStatement ExpressionStatement", () => {
  const node = {
    type: "ExpressionStatement",
    expression: { type: "CallExpression", callee: { type: "Identifier", name: "f" }, arguments: [] },
  };
  expect(generateStatement(node)).toBe("f();");
});

test("generateStatement ReturnStatement", () => {
  expect(generateStatement({ type: "ReturnStatement" })).toBe("return;");
  expect(
    generateStatement({
      type: "ReturnStatement",
      argument: { type: "Identifier", name: "v" },
    })
  ).toBe("return v;");
});

test("generateStatement BlockStatement", () => {
  const node = {
    type: "BlockStatement",
    body: [
      { type: "VariableDeclaration", kind: "let", declarations: [{ type: "VariableDeclarator", id: { type: "Identifier", name: "a" }, init: null }] },
      { type: "ReturnStatement", argument: { type: "Identifier", name: "a" } },
    ],
  };
  expect(generateStatement(node)).toBe("{\n  let a;\n  return a;\n}");
});

test("generateStatement IfStatement", () => {
  const node = {
    type: "IfStatement",
    test: { type: "Identifier", name: "x" },
    consequent: {
      type: "BlockStatement",
      body: [{ type: "ReturnStatement", argument: { type: "Literal", value: 1 } }],
    },
    alternate: null,
  };
  expect(generateStatement(node)).toBe("if (x) {\n  return 1;\n}");
});

test("generateStatement ForStatement", () => {
  const node = {
    type: "ForStatement",
    init: { type: "VariableDeclaration", kind: "let", declarations: [{ type: "VariableDeclarator", id: { type: "Identifier", name: "i" }, init: { type: "Literal", value: 0 } }] },
    test: { type: "BinaryExpression", left: { type: "Identifier", name: "i" }, operator: "<", right: { type: "Literal", value: 10 } },
    update: { type: "UpdateExpression", operator: "++", prefix: false, argument: { type: "Identifier", name: "i" } },
    body: { type: "BlockStatement", body: [] },
  };
  expect(generateStatement(node)).toBe("for (let i = 0; i < 10; i++) {}");
});

test("generateStatement unsupported statement type throws", () => {
  expect(() => generateStatement({ type: "WithStatement", object: {}, body: {} })).toThrow("Unsupported statement type: WithStatement");
});

import {
  ArrayExpression,
  EmptyStatement,
  Expression,
  Identifier,
  Literal,
  Node,
  ObjectExpression,
  Property,
  VariableDeclaration,
  VariableDeclarator,
} from "acorn";
import { TSTypeReference } from "../ast/types";
import { Modifier } from "../model/modifier";
import { ModuleImports } from "../model/moduleImports";
import { SymbolRef } from "../model/symbolRef";
import { toIdentifier } from "./generator";

const synthIdentifier = (name: string, symbolRef?: SymbolRef): Identifier => {
  const id = { type: "Identifier", name } as Identifier & { symbolRef?: SymbolRef };
  if (symbolRef)
    id.symbolRef = symbolRef;
  return id;
};

const synthVariableDeclaration = (
  id: Node,
  init?: Node,
  kind: VariableDeclaration["kind"] = "const",
  modifiers = 0
): VariableDeclaration => ({
  type: "VariableDeclaration",
  kind,
  modifiers,
  declarations: [{
    type: "VariableDeclarator",
    id,
    init
  } as VariableDeclarator]
} as VariableDeclaration);

const synthAliasImports = (moduleImports: ModuleImports): VariableDeclaration[] => {
  const out: VariableDeclaration[] = [];
  for (const localName in moduleImports.byLocal) {
    const binding = moduleImports.byLocal[localName];
    out.push(synthVariableDeclaration(
      synthIdentifier(localName),
      synthIdentifier(toIdentifier(binding.source, binding.importedName)),
      "const",
      Modifier.ClosureNamespace
    ));
  }
  return out;
};

const synthReadonlyArray = (elementType: Node): TSTypeReference => ({
  type: "TSTypeReference",
  typeName: synthIdentifier("ReadonlyArray"),
  typeArguments: {
    type: "TSTypeParameterInstantiation",
    params: [elementType]
  }
} as TSTypeReference);

const synthComment = (comment: string): EmptyStatement =>
  ({ type: "EmptyStatement", comment } as EmptyStatement);

const synthJsonValue = (value: unknown): Expression => {
  if (value == null || typeof value == "string" ||
    typeof value == "number" || typeof value == "boolean")
    return {
      type: "Literal",
      value,
      raw: JSON.stringify(value)
    } as Literal;

  if (Array.isArray(value))
    return {
      type: "ArrayExpression",
      elements: value.map(synthJsonValue)
    } as ArrayExpression;
  return {
    type: "ObjectExpression",
    properties: Object.entries(value as Record<string, unknown>).map(([key, inner]) => ({
      type: "Property",
      key: {
        type: "Literal",
        value: key,
        raw: JSON.stringify(key)
      } as Literal,
      value: synthJsonValue(inner),
      kind: "init",
      method: false,
      shorthand: false,
      computed: false,
    } as Property))
  } as ObjectExpression;
};

export {
  synthAliasImports,
  synthComment,
  synthIdentifier,
  synthJsonValue,
  synthReadonlyArray,
  synthVariableDeclaration
};

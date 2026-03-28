import {
  EmptyStatement,
  Identifier,
  Node,
  VariableDeclaration,
  VariableDeclarator
} from "acorn";
import { TSTypeParameterInstantiation, TSTypeReference } from "../ast/types";
import { Modifier } from "../model/modifier";
import { ModuleImports } from "../model/moduleImport";
import { toIdentifier } from "./generator";

const synthAliasImports = (moduleImports: ModuleImports): VariableDeclaration[] => {
  const out: VariableDeclaration[] = [];
  for (const localName in moduleImports.byLocal) {
    const binding = moduleImports.byLocal[localName];
    out.push({
      type: "VariableDeclaration",
      kind: "const",
      modifiers: Modifier.Readonly,
      declarations: [{
        type: "VariableDeclarator",
        id: { type: "Identifier", name: localName } as Identifier,
        init: {
          type: "Identifier",
          name: toIdentifier(binding.source, binding.importedName)
        } as Identifier
      } as VariableDeclarator]
    } as VariableDeclaration);
  }
  return out;
};

const synthReadonlyArray = (elementType: Node): TSTypeReference => ({
  type: "TSTypeReference",
  typeName: { type: "Identifier", name: "ReadonlyArray" } as Identifier,
  typeArguments: {
    type: "TSTypeParameterInstantiation",
    params: [elementType]
  } as unknown as TSTypeParameterInstantiation
} as TSTypeReference);

const synthComment = (comment: string): EmptyStatement =>
  ({ type: "EmptyStatement", comment } as EmptyStatement);

export {
  synthAliasImports,
  synthComment,
  synthReadonlyArray
};

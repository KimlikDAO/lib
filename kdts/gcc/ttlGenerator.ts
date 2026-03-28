import { Node } from "acorn";
import { isConditionalType, isIdentifier } from "../ast/guards";
import {
  TSConditionalType,
  TSEntityName,
  TSTypeAnnotation,
  TSTypeReference
} from "../ast/types";
import { toIdentifier } from "./generator";

const entityNameText = (node: TSEntityName): string =>
  isIdentifier(node) ? node.name : `${entityNameText(node.left)}.${node.right.name}`;

const getTypeReferenceName = (node: Node, options: { djs?: boolean }): string => {
  if (node.type == "TSTypeReference") {
    const { typeName } = node as TSTypeReference;
    if (options.djs && typeName.symbolRef)
      return toIdentifier(
        typeName.symbolRef.source,
        typeName.symbolRef.exportedName || entityNameText(typeName)
      );
    return entityNameText(typeName);
  }
  return "unknown";
};

const conditionalTypeNode = (node: TSConditionalType | TSTypeAnnotation): TSConditionalType => {
  if (isConditionalType(node))
    return node;
  if (isConditionalType(node.typeAnnotation))
    return node.typeAnnotation;
  throw new Error("Expected TSConditionalType");
};

const conditionalType = (node: TSConditionalType | TSTypeAnnotation, options: { djs?: boolean }): string => {
  const type = conditionalTypeNode(node);
  const trueType = getTypeReferenceName(type.trueType, options);
  const falseType = getTypeReferenceName(type.falseType, options);
  return "cond(" +
    "isTemplatized(T) && sub(rawTypeOf(T), 'IThenable')," +
    `type('${trueType}', templateTypeOf(T, 0)),` +
    `type('${falseType}', T))`;
}

export { conditionalType };

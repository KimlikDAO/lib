import { Node } from "acorn";
import { isConditionalType, isTypeReference } from "../ast/guards";
import { TsConditionalType, TsTypeAnnotationNode } from "../ast/types";
import { toIdentifier } from "./generator";

const getTypeReferenceName = (node: Node, options: { djs?: boolean }): string => {
  if (isTypeReference(node)) {
    const { typeName } = node;
    if (options.djs && typeName.symbolRef)
      return toIdentifier(typeName.symbolRef.source, typeName.symbolRef.exportedName || typeName.name);
    return typeName.name;
  }
  return "unknown";
};

const conditionalType = (node: Node, options: { djs?: boolean }): string => {
  const typeAnnotation = (node as TsTypeAnnotationNode).typeAnnotation;
  const type = isConditionalType(typeAnnotation)
    ? typeAnnotation
    : node as TsConditionalType;
  const trueType = getTypeReferenceName(type.trueType, options);
  const falseType = getTypeReferenceName(type.falseType, options);
  return "cond(" +
    "isTemplatized(T) && sub(rawTypeOf(T), 'IThenable')," +
    `type('${trueType}', templateTypeOf(T, 0)),` +
    `type('${falseType}', T))`;
}

export { conditionalType };

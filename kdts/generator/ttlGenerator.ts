import { Node } from "acorn";
import { toIdentifier } from "../gcc/generator";
import { SourceId } from "../model/moduleImport";

interface SymbolRef {
  source: SourceId;
  exportedName?: string;
  space: "type" | "value" | "namespace";
}

interface TsIdentifier extends Node {
  type: "Identifier";
  name: string;
  symbolRef?: SymbolRef;
}

interface TsTypeParameterInstantiation extends Node {
  type: "TSTypeParameterInstantiation";
  params: Node[];
}

interface TsTypeReference extends Node {
  type: "TSTypeReference";
  typeName: TsIdentifier;
  typeArguments?: TsTypeParameterInstantiation;
}

interface TsConditionalType extends Node {
  type: "TSConditionalType";
  trueType: Node;
  falseType: Node;
}

interface TsTypeAnnotationNode extends Node {
  typeAnnotation?: Node;
}

const isIdentifier = (node: Node | undefined): node is TsIdentifier =>
  node?.type == "Identifier";

const isTypeReference = (node: Node | undefined): node is TsTypeReference =>
  node?.type == "TSTypeReference" && isIdentifier((node as TsTypeReference).typeName);

const isConditionalType = (node: Node | undefined): node is TsConditionalType =>
  node?.type == "TSConditionalType";

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

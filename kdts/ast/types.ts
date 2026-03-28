import { Node } from "acorn";
import { SymbolRef } from "../model/symbolRef";

interface TsArrayType extends Node {
  type: "TSArrayType";
  elementType: Node;
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

export {
  TsArrayType,
  TsIdentifier,
  TsTypeParameterInstantiation,
  TsConditionalType,
  TsTypeReference,
  TsTypeAnnotationNode
}

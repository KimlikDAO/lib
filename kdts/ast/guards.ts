import { Node } from "acorn";
import {
  Expression,
  TSConditionalType,
  TSIdentifier,
  TSSatisfiesExpression,
  TypeNode,
  TSTypeReference
} from "./types";

const isIdentifier = (node: Node | undefined): node is TSIdentifier =>
  node?.type == "Identifier";

const isTypeReference = (
  node: Node | undefined
): node is TSTypeReference & { typeName: TSIdentifier } =>
  node?.type == "TSTypeReference" && isIdentifier((node as TSTypeReference).typeName);

const isConditionalType = (node: Node | undefined): node is TSConditionalType =>
  node?.type == "TSConditionalType";

const isSatisfiesExpression = (
  node: Node | null | undefined
): node is TSSatisfiesExpression & { expression: Expression } =>
  node?.type == "TSSatisfiesExpression";

const typeReferenceName = (node: Node | TypeNode | undefined): string | undefined =>
  isTypeReference(node) ? node.typeName.name : undefined;

export {
  isConditionalType,
  isIdentifier,
  isSatisfiesExpression,
  isTypeReference,
  typeReferenceName
};

import { Expression, Node } from "acorn";
import {
  TSConditionalType,
  TSIdentifier,
  TSSatisfiesExpression,
  TSTypeReference
} from "./types";

const isIdentifier = (node: Node | undefined): node is TSIdentifier =>
  node?.type == "Identifier";

const isTypeReference = (node: Node | undefined): node is TSTypeReference =>
  node?.type == "TSTypeReference" && isIdentifier((node as TSTypeReference).typeName);

const isConditionalType = (node: Node | undefined): node is TSConditionalType =>
  node?.type == "TSConditionalType";

const isSatisfiesExpression = (
  node: Node | null | undefined
): node is TSSatisfiesExpression & { expression: Expression } =>
  node?.type == "TSSatisfiesExpression";

export {
  isConditionalType,
  isIdentifier,
  isSatisfiesExpression,
  isTypeReference
};

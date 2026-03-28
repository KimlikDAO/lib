import { Node } from "acorn";
import {
  TsConditionalType,
  TsIdentifier,
  TsTypeReference
} from "./types";

const isIdentifier = (node: Node | undefined): node is TsIdentifier =>
  node?.type == "Identifier";

const isTypeReference = (node: Node | undefined): node is TsTypeReference =>
  node?.type == "TSTypeReference" && isIdentifier((node as TsTypeReference).typeName);

const isConditionalType = (node: Node | undefined): node is TsConditionalType =>
  node?.type == "TSConditionalType";

export {
  isConditionalType,
  isIdentifier,
  isTypeReference
};

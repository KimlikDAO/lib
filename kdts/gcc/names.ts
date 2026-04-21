import { Identifier } from "acorn";
import { TSQualifiedName } from "../ast/types";
import { SourceId } from "../model/source";

const isIdentifierName = (name: string): boolean =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);

const toIdentifier = (source: SourceId, name: string): string => {
  const text = `kdts$$${source}$${name == "*" ? "star" : name}`;
  const value = text.replaceAll(
    /[^A-Za-z0-9_$]/g,
    (char) => (char == "." || char == "-") ? "_" : "$"
  );
  return (value[0] >= "0" && value[0] <= "9") ? "_" + value : value;
};

const entityNameText = (node: Identifier | TSQualifiedName): string =>
  node.type == "Identifier" ? node.name : `${entityNameText(node.left)}.${node.right.name}`;

export {
  entityNameText,
  isIdentifierName,
  toIdentifier
};

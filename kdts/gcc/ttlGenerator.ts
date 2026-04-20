import { Literal, Node } from "acorn";
import { isConditionalType, isIdentifier } from "../ast/guards";
import { probeArrayLikeElementType } from "../ast/probe";
import {
  TSCallSignatureDeclaration,
  TSConditionalType,
  TSConstructSignatureDeclaration,
  TSEntityName,
  TSImportType,
  TSIndexSignature,
  TSMethodSignature,
  TSNamedTupleMember,
  TSParameter,
  TSPropertySignature,
  TSTypeAnnotation,
  TSTypeLiteral,
  TSTypeOperator,
  TSTypeParameterDeclaration,
  TSTypeReference,
  TypeAnnotationValue,
  TypeNode
} from "../ast/types";
import { entityNameText, toIdentifier } from "./names";

type RenderClosureTypeOptions = {
  djs?: boolean;
  templateNames?: readonly string[];
  templateBindings?: Readonly<Record<string, string>>;
};

type TtlNode =
  | { kind: "identifier"; name: string }
  | { kind: "string"; value: string }
  | { kind: "call"; callee: string; args: TtlNode[] }
  | { kind: "lambda"; param: string; body: TtlNode };

type ConditionalTypeOptions = RenderClosureTypeOptions & {
  freshNames?: Set<string>;
};

const entityNameForType = (
  node: TSEntityName,
  options: RenderClosureTypeOptions
): string => {
  const binding = options.templateBindings?.[entityNameText(node)];
  if (binding)
    return binding;
  if (options.djs && node.symbolRef)
    return toIdentifier(
      node.symbolRef.source,
      node.symbolRef.exportedName || entityNameText(node)
    );
  return entityNameText(node);
};

const hasTemplateName = (
  name: string,
  options: RenderClosureTypeOptions
): boolean =>
  !!options.templateBindings?.[name] || !!options.templateNames?.includes(name);

const isTemplateReference = (
  node: Node | undefined,
  options: RenderClosureTypeOptions
): node is TSTypeReference & { typeName: Node & { type: "Identifier"; name: string } } =>
  node?.type == "TSTypeReference" &&
  isIdentifier((node as TSTypeReference).typeName) &&
  !(node as TSTypeReference).typeArguments?.params.length &&
  hasTemplateName(((node as TSTypeReference).typeName as Node & {
    type: "Identifier";
    name: string;
  }).name, options);

const wrapUnion = (parts: string[]): string => {
  const unique = [...new Set(parts.filter(Boolean))];
  if (!unique.length)
    return "?";
  return unique.length == 1 ? unique[0]! : `(${unique.join("|")})`;
};

const literalTypeName = (literal: TSNamedTupleMember["label"] | Literal | Node): string => {
  if (literal.type != "Literal")
    return "string";
  const value = (literal as Literal).value;
  if (value == null)
    return "null";
  switch (typeof value) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    case "bigint": return "bigint";
    default: return "string";
  }
};

const renderIndexedAccessKey = (
  node: TypeNode,
  options: RenderClosureTypeOptions
): string => {
  if (node.type != "TSLiteralType" || node.literal.type != "Literal")
    return renderClosureType(node, options);
  const value = (node.literal as Literal).value;
  return typeof value == "string" ? JSON.stringify(value) : String(value);
};

const renderParamType = (
  param: TSParameter,
  options: RenderClosureTypeOptions
): string => {
  switch (param.type) {
    case "Identifier":
    case "ObjectPattern":
    case "ArrayPattern":
    case "RestElement":
    case "AssignmentPattern":
      return renderClosureType(param.typeAnnotation, options);
    case "TSParameterProperty":
      return renderParamType(param.parameter, options);
    default:
      return "?";
  }
};

const renderTupleElementType = (
  node: TypeNode,
  options: RenderClosureTypeOptions
): string => {
  if (node.type == "TSNamedTupleMember") {
    const member = node as TSNamedTupleMember;
    const inner = renderTupleElementType(member.elementType, options);
    return member.optional ? wrapUnion([inner, "undefined"]) : inner;
  }
  if (node.type == "TSRestType")
    return renderClosureType(node.typeAnnotation, options);
  return renderClosureType(node, options);
};

const renderTypeLiteral = (
  node: TSTypeLiteral,
  options: RenderClosureTypeOptions
): string => {
  const fields: string[] = [];
  for (const member of node.members) {
    if (member.type == "TSPropertySignature") {
      const property = member as TSPropertySignature;
      if (!isIdentifier(property.key))
        return "Object";
      const type = property.typeAnnotation
        ? renderClosureType(property.typeAnnotation, options)
        : "?";
      fields.push(
        `${property.key.name}: ${property.optional ? wrapUnion([type, "undefined"]) : type}`
      );
      continue;
    }
    if (member.type == "TSMethodSignature") {
      const method = member as TSMethodSignature;
      if (!isIdentifier(method.key))
        return "Object";
      const params = method.parameters.map((param) => renderParamType(param, options)).join(", ");
      const ret = method.typeAnnotation
        ? renderClosureType(method.typeAnnotation, options)
        : "void";
      fields.push(`${method.key.name}: function(${params}):${ret}`);
      continue;
    }
    if (member.type == "TSCallSignatureDeclaration") {
      const signature = member as TSCallSignatureDeclaration;
      const params = signature.parameters.map((param) => renderParamType(param, options)).join(", ");
      const ret = signature.typeAnnotation
        ? renderClosureType(signature.typeAnnotation, options)
        : "void";
      fields.push(`call: function(${params}):${ret}`);
      continue;
    }
    if (member.type == "TSConstructSignatureDeclaration") {
      const signature = member as TSConstructSignatureDeclaration;
      const params = signature.parameters.map((param) => renderParamType(param, options)).join(", ");
      const ret = signature.typeAnnotation
        ? renderClosureType(signature.typeAnnotation, options)
        : "?";
      fields.push(`new: function(new:${ret}${params ? `, ${params}` : ""})`);
      continue;
    }
    if (member.type == "TSIndexSignature") {
      const signature = member as TSIndexSignature;
      const ret = signature.typeAnnotation
        ? renderClosureType(signature.typeAnnotation, options)
        : "?";
      const indexType = signature.parameters[0]
        ? renderParamType(signature.parameters[0], options)
        : "string";
      fields.push(`[${indexType}]: ${ret}`);
      continue;
    }
    return "Object";
  }
  return `{ ${fields.join(", ")} }`;
};

const renderTypeReference = (
  node: TSTypeReference,
  options: RenderClosureTypeOptions
): string => {
  if (isTemplateReference(node, options))
    return entityNameForType(node.typeName, options);

  const typeName = entityNameForType(node.typeName, options);
  const args = node.typeArguments?.params.map((param) => renderClosureType(param, options)) || [];
  if (!args.length)
    return "!" + typeName;
  return `!${typeName}<${args.join(",")}>`;
};

const renderImportType = (
  node: TSImportType,
  options: RenderClosureTypeOptions
): string => {
  if (node.qualifier)
    return node.typeArguments?.params.length
      ? `!${entityNameForType(node.qualifier, options)}<${node.typeArguments.params.map((param) =>
        renderClosureType(param, options)
      ).join(",")}>`
      : "!" + entityNameForType(node.qualifier, options);
  return "?";
};

const renderTypeOperator = (
  node: TSTypeOperator,
  options: RenderClosureTypeOptions
): string => {
  if (node.operator == "readonly") {
    const elementType = probeArrayLikeElementType(node.typeAnnotation);
    if (elementType)
      return `!ReadonlyArray<${renderClosureType(elementType as TypeNode, options)}>`;
    return renderClosureType(node.typeAnnotation, options);
  }
  if (node.operator == "keyof")
    return "string";
  if (node.operator == "unique")
    return node.typeAnnotation.type == "TSSymbolKeyword"
      ? "symbol"
      : renderClosureType(node.typeAnnotation, options);
  return renderClosureType(node.typeAnnotation, options);
};

const renderClosureType = (
  node: TypeAnnotationValue | TSTypeAnnotation | null | undefined,
  options: RenderClosureTypeOptions = {}
): string => {
  if (!node)
    return "?";
  if (node.type == "TSTypeAnnotation")
    return renderClosureType(node.typeAnnotation, options);

  switch (node.type) {
    case "TSStringKeyword": return "string";
    case "TSNumberKeyword": return "number";
    case "TSBooleanKeyword": return "boolean";
    case "TSBigIntKeyword": return "bigint";
    case "TSAnyKeyword": return "?";
    case "TSUnknownKeyword": return "*";
    case "TSVoidKeyword": return "void";
    case "TSNullKeyword": return "null";
    case "TSUndefinedKeyword": return "undefined";
    case "TSObjectKeyword": return "Object";
    case "TSNeverKeyword": return "void";
    case "TSSymbolKeyword": return "symbol";
    case "TSArrayType":
      return `!Array<${renderClosureType(node.elementType, options)}>`;
    case "TSFunctionType": {
      const params = node.parameters.map((param) => renderParamType(param, options)).join(", ");
      return `function(${params}):${renderClosureType(node.typeAnnotation, options)}`;
    }
    case "TSConstructorType": {
      const params = node.parameters.map((param) => renderParamType(param, options)).join(", ");
      const ret = renderClosureType(node.typeAnnotation, options);
      return `function(new:${ret}${params ? `, ${params}` : ""})`;
    }
    case "TSConditionalType":
      return "?";
    case "TSLiteralType":
      return literalTypeName(node.literal);
    case "TSParenthesizedType":
      return `(${renderClosureType(node.typeAnnotation, options)})`;
    case "TSTupleType": {
      const elementTypes = node.elementTypes.map((element) =>
        renderTupleElementType(element, options)
      );
      return `!Array<${wrapUnion(elementTypes)}>`;
    }
    case "TSNamedTupleMember":
      return renderTupleElementType(node, options);
    case "TSUnionType":
      return wrapUnion(node.types.map((type) => renderClosureType(type, options)));
    case "TSIntersectionType":
      return "?";
    case "TSMappedType":
      return "Object";
    case "TSInferType":
      return node.typeParameter.constraint
        ? renderClosureType(node.typeParameter.constraint, options)
        : "?";
    case "TSOptionalType":
      return wrapUnion([renderClosureType(node.typeAnnotation, options), "undefined"]);
    case "TSRestType":
      return renderClosureType(node.typeAnnotation, options);
    case "TSIndexedAccessType":
      return `${renderClosureType(node.objectType, options)}[${renderIndexedAccessKey(node.indexType, options)}]`;
    case "TSTypeLiteral":
      return renderTypeLiteral(node, options);
    case "TSTypeOperator":
      return renderTypeOperator(node, options);
    case "TSTypeQuery":
      return `typeof ${node.exprName.type == "TSImportType"
        ? renderImportType(node.exprName, options)
        : entityNameForType(node.exprName, options)}`;
    case "TSTypeReference":
      return renderTypeReference(node, options);
    case "TSImportType":
      return renderImportType(node, options);
    case "TSThisType":
      return "this";
    case "TSTypePredicate":
      return "boolean";
    case "TSIntrinsicKeyword":
      return "?";
    default:
      return "?";
  }
};

const conditionalTypeNode = (node: TSConditionalType | TSTypeAnnotation): TSConditionalType => {
  if (isConditionalType(node))
    return node;
  if (isConditionalType(node.typeAnnotation))
    return node.typeAnnotation;
  throw new Error("Expected TSConditionalType");
};

const hasInferType = (node: Node | null | undefined): boolean => {
  if (!node)
    return false;
  if (node.type == "TSInferType")
    return true;
  for (const key in node) {
    if (key == "type" || key == "start" || key == "end" || key == "range" ||
      key == "loc" || key == "typeExpression" || key == "symbolRef")
      continue;
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const child of value)
        if (child && typeof child == "object" && "type" in child && hasInferType(child as Node))
          return true;
    } else if (value && typeof value == "object" && "type" in value &&
      hasInferType(value as Node))
      return true;
  }
  return false;
};

const identifier = (name: string): TtlNode => ({ kind: "identifier", name });
const stringLiteral = (value: string): TtlNode => ({ kind: "string", value });
const call = (callee: string, ...args: TtlNode[]): TtlNode => ({ kind: "call", callee, args });
const lambda = (param: string, body: TtlNode): TtlNode => ({ kind: "lambda", param, body });

const printTtl = (node: TtlNode): string => {
  switch (node.kind) {
    case "identifier": return node.name;
    case "string": return JSON.stringify(node.value);
    case "lambda": return `(${node.param}) => ${printTtl(node.body)}`;
    case "call": return `${node.callee}(${node.args.map(printTtl).join(", ")})`;
  }
};

const unwrapType = (node: TSConditionalType | TSTypeAnnotation | TypeNode): TypeNode =>
  node.type == "TSTypeAnnotation" ? node.typeAnnotation as TypeNode : node;

const makeTemplateParam = (name: string, options: ConditionalTypeOptions): string => {
  const used = options.freshNames ||= new Set(options.templateNames || []);
  let next = `${name}$0`;
  while (used.has(next))
    next = `${next}$`;
  used.add(next);
  return next;
};

const lowerType = (
  node: TypeNode,
  options: ConditionalTypeOptions
): TtlNode => {
  if (node.type == "TSNeverKeyword")
    return call("none");
  if (node.type == "TSUnknownKeyword")
    return call("unknown");
  if (node.type == "TSTypeReference" && isTemplateReference(node, options))
    return identifier(entityNameForType(node.typeName, options));
  if (node.type == "TSConditionalType")
    return lowerConditionalType(node, options);
  return call("typeExpr", stringLiteral(renderClosureType(node, options)));
};

const lowerConditionalBranch = (
  node: TypeNode,
  options: ConditionalTypeOptions
): TtlNode => lowerType(node, options);

const lowerConditional = (
  node: TSConditionalType,
  options: ConditionalTypeOptions
): TtlNode => call(
  "cond",
  call("sub", lowerType(node.checkType, options), lowerType(node.extendsType, options)),
  lowerConditionalBranch(node.trueType, options),
  lowerConditionalBranch(node.falseType, options)
);

const lowerConditionalType = (
  node: TSConditionalType,
  options: ConditionalTypeOptions
): TtlNode => {
  if (hasInferType(node))
    return call("unknown");
  const check = unwrapType(node.checkType);
  if (!isTemplateReference(check, options))
    return lowerConditional(node, options);

  const originalName = entityNameForType(check.typeName, options);
  const mappedName = makeTemplateParam(originalName, options);
  return call(
    "mapunion",
    identifier(originalName),
    lambda(mappedName, lowerConditional(node, {
      ...options,
      templateBindings: {
        ...options.templateBindings,
        [originalName]: mappedName
      }
    }))
  );
};

const conditionalType = (
  node: TSConditionalType | TSTypeAnnotation,
  options: ConditionalTypeOptions = {}
): string => printTtl(lowerConditionalType(conditionalTypeNode(node), options));

const templateNames = (
  node?: TSTypeParameterDeclaration | null
): string[] => node?.params.map((param) => param.name) || [];

export {
  conditionalType,
  renderClosureType,
  templateNames
};

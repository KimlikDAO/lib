import {
  ArrayPattern,
  AssignmentPattern,
  Identifier,
  Literal,
  MemberExpression,
  Node,
  ObjectPattern,
  RestElement
} from "acorn";
import { Modifier } from "../model/modifier";
import { SymbolRef } from "../model/symbolRef";

export type TsKeywordType =
  | "TSStringKeyword"
  | "TSNumberKeyword"
  | "TSBooleanKeyword"
  | "TSBigIntKeyword"
  | "TSAnyKeyword"
  | "TSUnknownKeyword"
  | "TSVoidKeyword"
  | "TSNullKeyword"
  | "TSUndefinedKeyword"
  | "TSObjectKeyword"
  | "TSNeverKeyword";

export interface TsKeywordNode<T extends TsKeywordType = TsKeywordType> extends Node {
  type: T;
}

export type TsIdentifier = Identifier;

export interface TsQualifiedName extends Node {
  type: "TSQualifiedName";
  left: TsEntityName;
  right: Identifier;
  name?: string;
  symbolRef?: SymbolRef;
}

export type TsEntityName = Identifier | TsQualifiedName;

export interface TsArrayType extends Node {
  type: "TSArrayType";
  elementType: Node;
}

export interface TsAsExpression extends Node {
  type: "TSAsExpression";
  expression: Node;
  typeAnnotation: Node;
}

export interface TsNamedTypeNode extends Node {
  typeName?: { name?: string } | null;
}

export interface TsSatisfiesExpression extends Node {
  type: "TSSatisfiesExpression";
  expression: Node;
  typeAnnotation?: TsNamedTypeNode | null;
}

export interface TsNonNullExpression extends Node {
  type: "TSNonNullExpression";
  expression: Node;
}

export type TsParameter =
  | Identifier
  | ArrayPattern
  | ObjectPattern
  | RestElement
  | AssignmentPattern
  | MemberExpression
  | TsParameterProperty;

export interface TsTypeParameter extends Node {
  type: "TSTypeParameter";
  name: string;
  constraint?: Node | null;
  default?: Node | null;
}

export interface TsTypeParameterDeclaration extends Node {
  type: "TSTypeParameterDeclaration";
  params: TsTypeParameter[];
}

export interface TsTypeParameterInstantiation extends Node {
  type: "TSTypeParameterInstantiation";
  params: Node[];
}

export interface TsTypeAnnotation extends Node {
  type: "TSTypeAnnotation";
  typeAnnotation: Node;
}

export interface TsFunctionType extends Node {
  type: "TSFunctionType";
  parameters: TsParameter[];
  typeAnnotation: Node;
  typeParameters?: TsTypeParameterDeclaration | null;
}

export interface TsConstructorType extends Node {
  type: "TSConstructorType";
  parameters: TsParameter[];
  typeAnnotation: Node;
  typeParameters?: TsTypeParameterDeclaration | null;
}

export interface TsConditionalType extends Node {
  type: "TSConditionalType";
  checkType: Node;
  extendsType: Node;
  trueType: Node;
  falseType: Node;
}

export interface TsLiteralType extends Node {
  type: "TSLiteralType";
  literal: Literal;
}

export interface TsParenthesizedType extends Node {
  type: "TSParenthesizedType";
  typeAnnotation: Node;
}

export interface TsTupleType extends Node {
  type: "TSTupleType";
  elementTypes: Node[];
}

export interface TsUnionType extends Node {
  type: "TSUnionType";
  types: Node[];
}

export interface TsTypeLiteral extends Node {
  type: "TSTypeLiteral";
  members: Node[];
}

export interface TsTypeOperator extends Node {
  type: "TSTypeOperator";
  operator: "keyof" | "readonly" | "unique";
  typeAnnotation: Node;
}

export interface TsTypeQuery extends Node {
  type: "TSTypeQuery";
  exprName: Node;
}

export interface TsTypeReference extends Node {
  type: "TSTypeReference";
  typeName: TsEntityName;
  typeArguments?: TsTypeParameterInstantiation | null;
}

export interface TsExpressionWithTypeArguments extends Node {
  type: "TSExpressionWithTypeArguments";
  expression: Node;
  typeArguments?: TsTypeParameterInstantiation | null;
  typeParameters?: TsTypeParameterInstantiation | null;
}

export interface TsEnumMember extends Node {
  type: "TSEnumMember";
  id: Identifier | Literal;
  initializer?: Node | null;
}

export interface TsEnumDeclaration extends Node {
  type: "TSEnumDeclaration";
  id: Identifier;
  members: TsEnumMember[];
}

export interface TsTypeAliasDeclaration extends Node {
  type: "TSTypeAliasDeclaration";
  id: Identifier;
  typeAnnotation: Node;
  typeParameters?: TsTypeParameterDeclaration | null;
}

export interface TsInterfaceBody extends Node {
  type: "TSInterfaceBody";
  body: Node[];
}

export interface TsInterfaceDeclaration extends Node {
  type: "TSInterfaceDeclaration";
  id: Identifier;
  body: TsInterfaceBody;
  extends?: TsExpressionWithTypeArguments[] | null;
  typeParameters?: TsTypeParameterDeclaration | null;
}

export interface TsMethodSignature extends Node {
  type: "TSMethodSignature";
  key: Node;
  parameters: TsParameter[];
  modifiers: Modifier;
  typeParameters?: TsTypeParameterDeclaration | null;
  typeAnnotation?: TsTypeAnnotation | null;
}

export interface TsPropertySignature extends Node {
  type: "TSPropertySignature";
  key: Node;
  modifiers: Modifier;
  optional?: boolean;
  typeAnnotation?: TsTypeAnnotation | null;
}

export interface TsParameterProperty extends Node {
  type: "TSParameterProperty";
  parameter: TsParameter;
  readonly?: boolean;
  optional?: boolean;
  typeAnnotation?: TsTypeAnnotation | null;
}

export interface TsDeclareFunction extends Node {
  type: "TSDeclareFunction";
  id: Identifier | null;
  params: TsParameter[];
  returnType?: TsTypeAnnotation | null;
  typeParameters?: TsTypeParameterDeclaration | null;
}

export type TsDeclaration =
  | TsEnumDeclaration
  | TsTypeAliasDeclaration
  | TsInterfaceDeclaration
  | TsDeclareFunction;

export type TsNode =
  | TsKeywordNode
  | TsArrayType
  | TsAsExpression
  | TsSatisfiesExpression
  | TsNonNullExpression
  | TsFunctionType
  | TsConstructorType
  | TsConditionalType
  | TsLiteralType
  | TsParenthesizedType
  | TsTupleType
  | TsUnionType
  | TsQualifiedName
  | TsTypeAnnotation
  | TsTypeLiteral
  | TsTypeOperator
  | TsTypeQuery
  | TsTypeParameter
  | TsTypeParameterDeclaration
  | TsTypeParameterInstantiation
  | TsTypeReference
  | TsExpressionWithTypeArguments
  | TsDeclaration
  | TsInterfaceBody
  | TsMethodSignature
  | TsPropertySignature
  | TsParameterProperty;

export interface TsTypeAnnotationNode extends Node {
  typeAnnotation?: Node | null;
}

declare module "acorn" {
  interface Identifier {
    optional?: boolean;
    typeAnnotation?: TsTypeAnnotation | null;
    symbolRef?: SymbolRef;
  }

  interface MemberExpression {
    typeAnnotation?: TsTypeAnnotation | null;
  }

  interface ObjectPattern {
    optional?: boolean;
    typeAnnotation?: TsTypeAnnotation | null;
  }

  interface ArrayPattern {
    optional?: boolean;
    typeAnnotation?: TsTypeAnnotation | null;
  }

  interface RestElement {
    optional?: boolean;
    typeAnnotation?: TsTypeAnnotation | null;
  }

  interface AssignmentPattern {
    optional?: boolean;
    typeAnnotation?: TsTypeAnnotation | null;
  }

  interface Function {
    modifiers: Modifier;
    returnType?: TsTypeAnnotation | null;
    typeAnnotation?: TsTypeAnnotation | null;
    typeParameters?: TsTypeParameterDeclaration | null;
  }

  interface MethodDefinition {
    modifiers: Modifier;
    override?: boolean;
    typeParameters?: TsTypeParameterDeclaration | null;
  }

  interface PropertyDefinition {
    modifiers: Modifier;
    optional?: boolean;
    override?: boolean;
    readonly?: boolean;
    typeAnnotation?: TsTypeAnnotation | null;
  }

  interface VariableDeclaration {
    modifiers: Modifier;
  }

  interface Class {
    implements?: TsExpressionWithTypeArguments[] | null;
    typeParameters?: TsTypeParameterDeclaration | null;
  }

  interface ImportDeclaration {
    importKind?: "type" | "value";
  }

  interface ImportSpecifier {
    importKind?: "type" | "value";
  }

  interface NodeTypes {
    ts: TsNode;
  }
}

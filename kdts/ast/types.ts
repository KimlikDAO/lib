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

export type TSKeywordType =
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

export interface TSKeywordNode<T extends TSKeywordType = TSKeywordType> extends Node {
  type: T;
}

export type TSIdentifier = Identifier;

export interface TSQualifiedName extends Node {
  type: "TSQualifiedName";
  left: TSEntityName;
  right: Identifier;
  symbolRef?: SymbolRef;
}

export type TSEntityName = Identifier | TSQualifiedName;

export interface TSArrayType extends Node {
  type: "TSArrayType";
  elementType: Node;
}

export interface TSAsExpression extends Node {
  type: "TSAsExpression";
  expression: Node;
  typeAnnotation: Node;
}

export interface TSNamedTypeNode extends Node {
  typeName?: { name?: string };
}

export interface TSSatisfiesExpression extends Node {
  type: "TSSatisfiesExpression";
  expression: Node;
  typeAnnotation?: TSNamedTypeNode;
}

export interface TSNonNullExpression extends Node {
  type: "TSNonNullExpression";
  expression: Node;
}

export type TSParameter =
  | Identifier
  | ArrayPattern
  | ObjectPattern
  | RestElement
  | AssignmentPattern
  | MemberExpression
  | TSParameterProperty;

export interface TSTypeParameter extends Node {
  type: "TSTypeParameter";
  name: string;
  constraint?: Node;
  default?: Node;
}

export interface TSTypeParameterDeclaration extends Node {
  type: "TSTypeParameterDeclaration";
  params: TSTypeParameter[];
}

export interface TSTypeParameterInstantiation extends Node {
  type: "TSTypeParameterInstantiation";
  params: Node[];
}

export interface TSTypeAnnotation extends Node {
  type: "TSTypeAnnotation";
  typeAnnotation: Node;
}

export interface TSFunctionType extends Node {
  type: "TSFunctionType";
  parameters: TSParameter[];
  typeAnnotation: Node;
  typeParameters?: TSTypeParameterDeclaration;
}

export interface TSConstructorType extends Node {
  type: "TSConstructorType";
  parameters: TSParameter[];
  typeAnnotation: Node;
  typeParameters?: TSTypeParameterDeclaration;
}

export interface TSConditionalType extends Node {
  type: "TSConditionalType";
  checkType: Node;
  extendsType: Node;
  trueType: Node;
  falseType: Node;
}

export interface TSLiteralType extends Node {
  type: "TSLiteralType";
  literal: Literal;
}

export interface TSParenthesizedType extends Node {
  type: "TSParenthesizedType";
  typeAnnotation: Node;
}

export interface TSTupleType extends Node {
  type: "TSTupleType";
  elementTypes: Node[];
}

export interface TSNamedTupleMember extends Node {
  type: "TSNamedTupleMember";
  label: Node;
  elementType: Node;
  optional?: boolean;
}

export interface TSUnionType extends Node {
  type: "TSUnionType";
  types: Node[];
}

export type TSMappedModifier = boolean | "+" | "-";

export interface TSMappedType extends Node {
  type: "TSMappedType";
  readonly?: TSMappedModifier;
  optional?: TSMappedModifier;
  typeParameter: Node;
  nameType?: Node | null;
  typeAnnotation?: Node;
}

export interface TSTypeLiteral extends Node {
  type: "TSTypeLiteral";
  members: Node[];
}

export interface TSTypeOperator extends Node {
  type: "TSTypeOperator";
  operator: "keyof" | "readonly" | "unique";
  typeAnnotation: Node;
}

export interface TSTypeQuery extends Node {
  type: "TSTypeQuery";
  exprName: Node;
}

export interface TSTypeReference extends Node {
  type: "TSTypeReference";
  typeName: TSEntityName;
  typeArguments?: TSTypeParameterInstantiation;
}

export interface TSExpressionWithTypeArguments extends Node {
  type: "TSExpressionWithTypeArguments";
  expression: Node;
  typeArguments?: TSTypeParameterInstantiation;
  typeParameters?: TSTypeParameterInstantiation;
}

export interface TSModuleBlock extends Node {
  type: "TSModuleBlock";
  body: Node[];
}

export interface TSModuleDeclaration extends Node {
  type: "TSModuleDeclaration";
  id: Identifier | Literal;
  body?: TSModuleBlock | TSModuleDeclaration;
  declare?: boolean;
  global?: boolean;
}

export interface TSEnumMember extends Node {
  type: "TSEnumMember";
  id: Identifier | Literal;
  initializer?: Node;
}

export interface TSEnumDeclaration extends Node {
  type: "TSEnumDeclaration";
  id: Identifier;
  members: TSEnumMember[];
}

export interface TSTypeAliasDeclaration extends Node {
  type: "TSTypeAliasDeclaration";
  id: Identifier;
  typeAnnotation: Node;
  typeParameters?: TSTypeParameterDeclaration;
}

export interface TSInterfaceBody extends Node {
  type: "TSInterfaceBody";
  body: Node[];
}

export interface TSInterfaceDeclaration extends Node {
  type: "TSInterfaceDeclaration";
  id: Identifier;
  body: TSInterfaceBody;
  extends?: TSExpressionWithTypeArguments[];
  typeParameters?: TSTypeParameterDeclaration;
}

export interface TSMethodSignature extends Node {
  type: "TSMethodSignature";
  key: Node;
  parameters: TSParameter[];
  modifiers: Modifier;
  typeParameters?: TSTypeParameterDeclaration ;
  typeAnnotation?: TSTypeAnnotation;
}

export interface TSPropertySignature extends Node {
  type: "TSPropertySignature";
  key: Node;
  modifiers: Modifier;
  optional?: boolean;
  typeAnnotation?: TSTypeAnnotation;
}

export interface TSParameterProperty extends Node {
  type: "TSParameterProperty";
  parameter: TSParameter;
  readonly?: boolean;
  typeAnnotation?: TSTypeAnnotation;
}

export interface TSDeclareFunction extends Node {
  type: "TSDeclareFunction";
  id: Identifier | null;
  params: TSParameter[];
  returnType?: TSTypeAnnotation;
  typeParameters?: TSTypeParameterDeclaration;
}

export type TSDeclaration =
  | TSModuleDeclaration
  | TSEnumDeclaration
  | TSTypeAliasDeclaration
  | TSInterfaceDeclaration
  | TSDeclareFunction;

export type TSNode =
  | TSKeywordNode
  | TSArrayType
  | TSAsExpression
  | TSSatisfiesExpression
  | TSNonNullExpression
  | TSFunctionType
  | TSConstructorType
  | TSConditionalType
  | TSLiteralType
  | TSParenthesizedType
  | TSTupleType
  | TSNamedTupleMember
  | TSUnionType
  | TSMappedType
  | TSQualifiedName
  | TSTypeAnnotation
  | TSTypeLiteral
  | TSTypeOperator
  | TSTypeQuery
  | TSTypeParameter
  | TSTypeParameterDeclaration
  | TSTypeParameterInstantiation
  | TSTypeReference
  | TSExpressionWithTypeArguments
  | TSModuleBlock
  | TSDeclaration
  | TSInterfaceBody
  | TSMethodSignature
  | TSPropertySignature
  | TSParameterProperty;

export interface TSTypeAnnotationNode extends Node {
  typeAnnotation?: Node;
}

declare module "acorn" {
  interface Identifier {
    optional?: boolean;
    typeAnnotation?: TSTypeAnnotation;
    symbolRef?: SymbolRef;
  }

  interface MemberExpression {
    typeAnnotation?: TSTypeAnnotation;
  }

  interface ObjectPattern {
    optional?: boolean;
    typeAnnotation?: TSTypeAnnotation;
  }

  interface ArrayPattern {
    optional?: boolean;
    typeAnnotation?: TSTypeAnnotation;
  }

  interface RestElement {
    optional?: boolean;
    typeAnnotation?: TSTypeAnnotation;
  }

  interface AssignmentPattern {
    optional?: boolean;
    typeAnnotation?: TSTypeAnnotation;
  }

  interface EmptyStatement {
    comment?: string;
  }

  interface Function {
    modifiers: Modifier;
    returnType?: TSTypeAnnotation;
    typeAnnotation?: TSTypeAnnotation;
    typeParameters?: TSTypeParameterDeclaration;
  }

  interface MethodDefinition {
    modifiers: Modifier;
    optional?: boolean;
    override?: boolean;
    typeParameters?: TSTypeParameterDeclaration;
  }

  interface PropertyDefinition {
    modifiers: Modifier;
    optional?: boolean;
    override?: boolean;
    readonly?: boolean;
    typeAnnotation?: TSTypeAnnotation;
  }

  interface VariableDeclaration {
    modifiers: Modifier;
  }

  interface VariableDeclarator {
    modifiers?: Modifier;
  }

  interface Class {
    implements?: TSExpressionWithTypeArguments[];
    typeParameters?: TSTypeParameterDeclaration;
  }

  interface ImportDeclaration {
    importKind?: "type" | "value";
  }

  interface ImportSpecifier {
    importKind?: "type" | "value";
  }

  interface NodeTypes {
    ts: TSNode;
  }
}

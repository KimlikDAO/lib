import {
  ArrayPattern,
  AssignmentPattern,
  Expression as JsExpression,
  Identifier,
  Literal,
  MemberExpression,
  Node,
  ObjectPattern,
  RestElement,
  ReturnStatement as JsReturnStatement,
  VariableDeclarator as JsVariableDeclarator
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
  | "TSNeverKeyword"
  | "TSSymbolKeyword";

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
  elementType: TypeNode;
}

export type Expression =
  | JsExpression
  | TSAsExpression
  | TSSatisfiesExpression
  | TSNonNullExpression
  | TSTypeAssertion
  | TSTypeCastExpression
  | TSInstantiationExpression;

export type TypeAnnotationValue = TypeNode | TSTypePredicate;

export interface TSAsExpression extends Node {
  type: "TSAsExpression";
  expression: Expression;
  typeAnnotation: TypeNode;
}

export interface TSSatisfiesExpression extends Node {
  type: "TSSatisfiesExpression";
  expression: Expression;
  typeAnnotation: TypeNode;
}

export interface TSNonNullExpression extends Node {
  type: "TSNonNullExpression";
  expression: Expression;
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
  constraint?: TypeNode;
  default?: TypeNode;
}

export interface TSTypeParameterDeclaration extends Node {
  type: "TSTypeParameterDeclaration";
  params: TSTypeParameter[];
}

export interface TSTypeParameterInstantiation extends Node {
  type: "TSTypeParameterInstantiation";
  params: TypeNode[];
}

export interface TSTypeAnnotation extends Node {
  type: "TSTypeAnnotation";
  typeAnnotation: TypeAnnotationValue;
}

export interface TSFunctionType extends Node {
  type: "TSFunctionType";
  parameters: TSParameter[];
  typeAnnotation: TSTypeAnnotation;
  typeParameters?: TSTypeParameterDeclaration;
}

export interface TSConstructorType extends Node {
  type: "TSConstructorType";
  parameters: TSParameter[];
  typeAnnotation: TSTypeAnnotation;
  typeParameters?: TSTypeParameterDeclaration;
}

export interface TSConditionalType extends Node {
  type: "TSConditionalType";
  checkType: TypeNode;
  extendsType: TypeNode;
  trueType: TypeNode;
  falseType: TypeNode;
}

export interface TSLiteralType extends Node {
  type: "TSLiteralType";
  literal: Literal | JsExpression;
}

export interface TSParenthesizedType extends Node {
  type: "TSParenthesizedType";
  typeAnnotation: TypeNode;
}

export interface TSTupleType extends Node {
  type: "TSTupleType";
  elementTypes: TypeNode[];
}

export interface TSNamedTupleMember extends Node {
  type: "TSNamedTupleMember";
  label: Node;
  elementType: TypeNode;
  optional?: boolean;
}

export interface TSUnionType extends Node {
  type: "TSUnionType";
  types: TypeNode[];
}

export interface TSIntersectionType extends Node {
  type: "TSIntersectionType";
  types: TypeNode[];
}

export type TSMappedModifier = boolean | "+" | "-";

export interface TSMappedType extends Node {
  type: "TSMappedType";
  readonly?: TSMappedModifier;
  optional?: TSMappedModifier;
  typeParameter: TSTypeParameter;
  nameType?: TypeNode | null;
  typeAnnotation?: TypeNode;
}

export interface TSInferType extends Node {
  type: "TSInferType";
  typeParameter: TSTypeParameter;
}

export interface TSOptionalType extends Node {
  type: "TSOptionalType";
  typeAnnotation: TypeNode;
}

export interface TSRestType extends Node {
  type: "TSRestType";
  typeAnnotation: TypeNode;
}

export interface TSIndexedAccessType extends Node {
  type: "TSIndexedAccessType";
  objectType: TypeNode;
  indexType: TypeNode;
}

export type TypeElement =
  | TSCallSignatureDeclaration
  | TSConstructSignatureDeclaration
  | TSIndexSignature
  | TSMethodSignature
  | TSPropertySignature;

export interface TSTypeLiteral extends Node {
  type: "TSTypeLiteral";
  members: TypeElement[];
}

export interface TSTypeOperator extends Node {
  type: "TSTypeOperator";
  operator: "keyof" | "readonly" | "unique";
  typeAnnotation: TypeNode;
}

export interface TSTypeQuery extends Node {
  type: "TSTypeQuery";
  exprName: TSEntityName | TSImportType;
  typeArguments?: TSTypeParameterInstantiation;
}

export interface TSTypeReference extends Node {
  type: "TSTypeReference";
  typeName: TSEntityName;
  typeArguments?: TSTypeParameterInstantiation;
}

export interface TSImportType extends Node {
  type: "TSImportType";
  argument: JsExpression;
  qualifier?: TSEntityName;
  typeArguments?: TSTypeParameterInstantiation;
}

export interface TSThisType extends Node {
  type: "TSThisType";
}

export interface TSTypePredicate extends Node {
  type: "TSTypePredicate";
  parameterName: TSIdentifier | TSThisType;
  typeAnnotation: TSTypeAnnotation | null;
  asserts: boolean;
}

export interface TSIntrinsicKeyword extends Node {
  type: "TSIntrinsicKeyword";
}

export interface TSExpressionWithTypeArguments extends Node {
  type: "TSExpressionWithTypeArguments";
  expression: TSEntityName;
  typeArguments?: TSTypeParameterInstantiation;
  typeParameters?: TSTypeParameterInstantiation;
}

export type TypeNode =
  | TSKeywordNode
  | TSArrayType
  | TSFunctionType
  | TSConstructorType
  | TSConditionalType
  | TSLiteralType
  | TSParenthesizedType
  | TSTupleType
  | TSNamedTupleMember
  | TSUnionType
  | TSIntersectionType
  | TSMappedType
  | TSInferType
  | TSOptionalType
  | TSRestType
  | TSIndexedAccessType
  | TSTypeLiteral
  | TSTypeOperator
  | TSTypeQuery
  | TSTypeReference
  | TSImportType
  | TSThisType
  | TSIntrinsicKeyword;

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
  initializer?: Expression;
}

export interface TSEnumDeclaration extends Node {
  type: "TSEnumDeclaration";
  id: Identifier;
  members: TSEnumMember[];
}

export interface TSTypeAliasDeclaration extends Node {
  type: "TSTypeAliasDeclaration";
  id: Identifier;
  typeAnnotation: TypeNode;
  typeParameters?: TSTypeParameterDeclaration;
}

export interface TSInterfaceBody extends Node {
  type: "TSInterfaceBody";
  body: TypeElement[];
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
  typeParameters?: TSTypeParameterDeclaration;
  typeAnnotation?: TSTypeAnnotation;
}

export interface TSCallSignatureDeclaration extends Node {
  type: "TSCallSignatureDeclaration";
  parameters: TSParameter[];
  typeParameters?: TSTypeParameterDeclaration;
  typeAnnotation?: TSTypeAnnotation;
}

export interface TSConstructSignatureDeclaration extends Node {
  type: "TSConstructSignatureDeclaration";
  parameters: TSParameter[];
  typeParameters?: TSTypeParameterDeclaration;
  typeAnnotation?: TSTypeAnnotation;
}

export interface TSIndexSignature extends Node {
  type: "TSIndexSignature";
  parameters: TSParameter[];
  typeAnnotation?: TSTypeAnnotation;
  readonly?: boolean;
  static?: boolean;
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

export interface TSExternalModuleReference extends Node {
  type: "TSExternalModuleReference";
  expression: JsExpression;
}

export type TSModuleReference =
  | TSEntityName
  | TSExternalModuleReference;

export interface TSImportEqualsDeclaration extends Node {
  type: "TSImportEqualsDeclaration";
  id: Identifier;
  moduleReference: TSModuleReference;
  importKind?: "type" | "value";
  isExport?: boolean;
}

export interface TSInstantiationExpression extends Node {
  type: "TSInstantiationExpression";
  expression: Expression;
  typeArguments: TSTypeParameterInstantiation;
}

export interface TSTypeAssertion extends Node {
  type: "TSTypeAssertion";
  typeAnnotation: TypeNode;
  expression: Expression;
}

export interface TSTypeCastExpression extends Node {
  type: "TSTypeCastExpression";
  expression: Expression;
  typeAnnotation: TSTypeAnnotation;
}

export type TSDeclaration =
  | TSModuleDeclaration
  | TSEnumDeclaration
  | TSTypeAliasDeclaration
  | TSInterfaceDeclaration
  | TSImportEqualsDeclaration
  | TSDeclareFunction;

export type VariableDeclarator =
  Omit<JsVariableDeclarator, "init"> & {
    init?: Expression | null;
    modifiers?: Modifier;
  };

export type ReturnStatement =
  Omit<JsReturnStatement, "argument"> & {
    argument?: Expression | null;
  };

export type TSNode =
  | TSKeywordNode
  | TSArrayType
  | TSAsExpression
  | TSSatisfiesExpression
  | TSNonNullExpression
  | TSTypeAssertion
  | TSTypeCastExpression
  | TSInstantiationExpression
  | TSFunctionType
  | TSConstructorType
  | TSConditionalType
  | TSLiteralType
  | TSParenthesizedType
  | TSTupleType
  | TSNamedTupleMember
  | TSUnionType
  | TSIntersectionType
  | TSMappedType
  | TSInferType
  | TSOptionalType
  | TSRestType
  | TSIndexedAccessType
  | TSQualifiedName
  | TSTypeAnnotation
  | TSTypeLiteral
  | TSTypeOperator
  | TSTypeQuery
  | TSTypeParameter
  | TSTypeParameterDeclaration
  | TSTypeParameterInstantiation
  | TSTypePredicate
  | TSTypeReference
  | TSImportType
  | TSThisType
  | TSIntrinsicKeyword
  | TSExpressionWithTypeArguments
  | TSExternalModuleReference
  | TSModuleBlock
  | TSDeclaration
  | TSInterfaceBody
  | TSMethodSignature
  | TSCallSignatureDeclaration
  | TSConstructSignatureDeclaration
  | TSIndexSignature
  | TSPropertySignature
  | TSParameterProperty;

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

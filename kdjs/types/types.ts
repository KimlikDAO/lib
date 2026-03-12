import { Modifier } from "./modifier";

type Context = {
  toParam?: boolean;
  wrap?: boolean;
  bare?: boolean;
};

/**
 * Removes nullable/non-nullable prefixes (? and !) from a type string
 */
const stripModifiers = (typeStr: string): string =>
  typeStr.startsWith("!") || typeStr.startsWith("?")
    ? typeStr.substring(1)
    : typeStr;

enum PrimitiveTypeName {
  BigInt = "bigint",
  Boolean = "boolean",
  Null = "null",
  Number = "number",
  String = "string",
  Symbol = "symbol",
  Undefined = "undefined",
}

enum TopTypeName {
  Any = "?",
  Unknown = "*",
}

class Type {
  constructor(public modifiers: number = 0) {}
  isNullable(): boolean { return !!(this.modifiers & Modifier.Nullable); }
  isOptional(): boolean { return !!(this.modifiers & Modifier.Optional); }
  toClosureExpr(_context?: Context): string { throw "Abstract method"; }
  toTsExpr(_context?: Context): string { throw "Abstract method"; }
  addToUnion(union: UnionType): void { union.addSingle(this); }
}

class UnionType extends Type {
  typeMap: Map<string, Type>;

  constructor(types?: Type[]) {
    super();
    this.typeMap = new Map();

    if (types) for (const type of types) type.addToUnion(this);
  }

  clear(): void { this.typeMap.clear(); }

  get types(): Type[] { return Array.from(this.typeMap.values()); }

  override addToUnion(union: UnionType): void {
    union.modifiers |= this.modifiers;
    for (const type of this.typeMap.values())
      type.addToUnion(union);
  }

  addSingle(type: Type): void {
    this.modifiers |= type.modifiers;
    this.typeMap.set(type.toClosureExpr({ bare: true }), type);
  }

  override toClosureExpr({ toParam, wrap, bare }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;

    if (this.typeMap.size == 1) {
      const type = Array.from(this.typeMap.values())[0];
      if (type instanceof TopType) return type.toClosureExpr({ toParam });
    }

    let expr = "";
    let separator = "";
    for (const type of Array.from(this.typeMap.values())) {
      expr += separator + type.toClosureExpr({ bare: true });
      separator = "|";
    }
    if (modifiers & Modifier.Nullable) expr += "|null";
    if ((modifiers & Modifier.Optional) && !toParam) expr += "|undefined";
    if (wrap && (this.typeMap.size > 1 ||
      !!(modifiers & Modifier.Nullable) ||
      (!!(modifiers & Modifier.Optional) && !toParam)))
      expr = `(${expr})`;
    if ((modifiers & Modifier.Optional) && toParam) expr += "=";

    return expr;
  }

  override toTsExpr({ toParam, wrap, bare }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;

    if (this.typeMap.size == 1) {
      const type = Array.from(this.typeMap.values())[0];
      if (type instanceof TopType) return type.toTsExpr({ toParam });
    }

    let expr = "";
    let separator = "";
    for (const type of Array.from(this.typeMap.values())) {
      expr += separator + type.toTsExpr({ bare: true });
      separator = " | ";
    }
    if (modifiers & Modifier.Nullable)
      expr += " | null";
    if ((modifiers & Modifier.Optional) && !toParam)
      expr += " | undefined";
    if (wrap && (this.typeMap.size > 1 ||
      !!(modifiers & Modifier.Nullable) ||
      (!!(modifiers & Modifier.Optional) && !toParam)))
      expr = `(${expr})`;
    if ((modifiers & Modifier.Optional) && toParam)
      expr += "=";

    return expr;
  }
}

class PrimitiveType extends Type {
  readonly name: PrimitiveTypeName;

  constructor(name: PrimitiveTypeName) {
    const modifiers =
      name === PrimitiveTypeName.Null
        ? Modifier.Nullable
        : name === PrimitiveTypeName.Undefined
          ? Modifier.Optional
          : 0;
    super(modifiers);
    this.name = name;
  }

  override toClosureExpr({ toParam, bare, wrap }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    let expr: string = this.name;
    if (
      modifiers & Modifier.Nullable &&
      this.name !== PrimitiveTypeName.Null
    )
      expr = "?" + expr;
    if (modifiers & Modifier.Optional) {
      const addingUndefined =
        !toParam && this.name !== PrimitiveTypeName.Undefined;
      expr += addingUndefined ? "|undefined" : toParam ? "=" : "";
      if (wrap && addingUndefined) expr = `(${expr})`;
    }
    return expr;
  }

  override toTsExpr({ toParam, bare, wrap }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    let expr: string = this.name;
    if (modifiers & Modifier.Nullable && this.name !== PrimitiveTypeName.Null)
      expr += " | null";
    if (modifiers & Modifier.Optional) {
      const addingUndefined = !toParam && this.name !== PrimitiveTypeName.Undefined;
      expr += addingUndefined ? " | undefined" : toParam ? "=" : "";
      if (wrap && addingUndefined)
        expr = `(${expr})`;
    }
    return expr;
  }

  override addToUnion(union: UnionType): void {
    if (this.name === PrimitiveTypeName.Null || this.name === PrimitiveTypeName.Undefined)
      union.modifiers |= this.modifiers;
    else
      union.addSingle(this);
  }
}

class TopType extends Type {
  readonly name: TopTypeName;

  constructor(name: TopTypeName) {
    super(Modifier.Nullable | Modifier.Optional);
    this.name = name;
  }

  override addToUnion(union: UnionType): void {
    union.clear();
    union.addSingle(this);
  }

  override toClosureExpr({ toParam }: Context = {}): string {
    return this.name + (toParam ? "=" : "");
  }

  override toTsExpr({ toParam }: Context = {}): string {
    const name = this.name === TopTypeName.Any ? "any" : "unknown";
    return name + (toParam ? "=" : "");
  }
}

class InstanceType extends Type {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  override toClosureExpr({ toParam, bare, wrap }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    let expr = this.name;
    if (expr == "RsaHashedImportParams") expr = "webCrypto." + expr;
    expr = (modifiers & Modifier.Nullable ? "?" : "!") + expr;
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : "|undefined";
      if (!toParam && wrap) expr = `(${expr})`;
    }
    return expr;
  }

  override toTsExpr({ toParam, bare, wrap }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    let expr = this.name;
    if (modifiers & Modifier.Nullable) expr += " | null";
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : " | undefined";
      if (!toParam && wrap) expr = `(${expr})`;
    }
    return expr;
  }
}

/**
 * A type which takes other types as parameter. In google closure, these are
 * defined through the at-template keyword.
 */
class GenericType extends Type {
  name: string;
  params: Type[];

  constructor(name: string, params: Type[]) {
    super();
    this.name = name;
    this.params = params;
  }

  override toClosureExpr({ toParam, bare, wrap }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;

    const typeName = this.name == "Record" ? "Object" : this.name;
    const typeParams = this.params.map((p) => p.toClosureExpr()).join(",");
    let expr = `${typeName}<${typeParams}>`;
    if (!(modifiers & Modifier.Nullable)) expr = "!" + expr;
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : "|undefined";
      if (!toParam && wrap) expr = `(${expr})`;
    }
    return expr;
  }

  override toTsExpr({ toParam, bare, wrap }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    let inner: string;
    if (this.name === "Array")
      inner = this.params[0].toTsExpr({ wrap: true }) + "[]";
    else if (this.name === "ReadonlyArray")
      inner = "readonly " + this.params[0].toTsExpr({ wrap: true }) + "[]";
    else
      inner = this.name + "<" + this.params.map((p) => p.toTsExpr()).join(", ") + ">";
    let expr = inner;
    if (modifiers & Modifier.Nullable) expr += " | null";
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : " | undefined";
      if (!toParam && wrap) expr = `(${expr})`;
    }
    return expr;
  }
}

class StructType extends Type {
  readonly members: Record<string, Type>;

  constructor(members: Record<string, Type>) {
    super();
    this.members = members;
  }

  override toClosureExpr({ toParam, wrap, bare }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    const members = this.members;
    let expr = "";
    let sep = "";
    for (const key in members) {
      expr += `${sep}${key}: ${members[key].toClosureExpr({ wrap: true })}`;
      sep = ", ";
    }
    expr = `{ ${expr} }`;

    if (modifiers & Modifier.Nullable) expr = "?" + expr;
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : "|undefined";
      if (!toParam && wrap) expr = `(${expr})`;
    }
    return expr;
  }

  override toTsExpr({ toParam, wrap, bare }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    const members = this.members;
    let expr = "";
    let sep = "";
    for (const key in members) {
      expr += `${sep}${key}: ${members[key].toTsExpr({ wrap: true })}`;
      sep = ", ";
    }
    expr = `{ ${expr} }`;
    if (modifiers & Modifier.Nullable) expr += " | null";
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : " | undefined";
      if (!toParam && wrap) expr = `(${expr})`;
    }
    return expr;
  }
}

class FunctionType extends Type {
  readonly params: Type[];
  readonly paramNames: string[] | undefined;
  readonly returnType: Type;
  readonly rest: boolean;
  readonly optionalAfter: number;
  readonly thisType: Type | undefined;

  constructor(
    params: Type[],
    paramNames: string[] | undefined,
    returnType: Type,
    rest = false,
    optionalAfter?: number,
    thisType?: Type
  ) {
    super();
    this.params = params;
    this.paramNames = paramNames;
    this.returnType = returnType;
    this.rest = rest;
    this.optionalAfter = optionalAfter ?? params.length;
    this.thisType = thisType;
  }

  toJsDoc(): void { }

  override toClosureExpr({ toParam, wrap, bare }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;

    const lastIdx = this.params.length - 1;
    const paramTypes = this.params
      .map((param, i) => {
        if (this.rest && i === lastIdx)
          return "..." + param.toClosureExpr({ bare: true });
        const isOptional = i >= this.optionalAfter;
        return param.toClosureExpr({ toParam: isOptional, wrap: true });
      })
      .join(", ");

    const returnTypeStr = this.returnType.toClosureExpr({ wrap: true });

    let functionType = "";
    if (this.thisType) {
      const thisTypeStr = stripModifiers(this.thisType.toClosureExpr());
      functionType = `function(this:${thisTypeStr}${paramTypes ? ", " + paramTypes : ""})`;
    } else
      functionType = `function(${paramTypes})`;

    if (!(this.returnType instanceof PrimitiveType &&
      this.returnType.name === PrimitiveTypeName.Undefined))
      functionType += `: ${returnTypeStr}`;

    if (modifiers & Modifier.Nullable)
      functionType = "?" + functionType;
    if (modifiers & Modifier.Optional) {
      functionType += toParam ? "=" : "|undefined";
      if (!toParam && wrap) functionType = `(${functionType})`;
    }
    return functionType;
  }

  toTsDoc(): string {
    const lastIdx = this.params.length - 1;
    const lines: string[] = [];
    if (this.modifiers & Modifier.NoInline) lines.push(" * @noinline");
    if (this.modifiers & Modifier.NoSideEffects)
      lines.push(" * @nosideeffects");
    if (this.modifiers & Modifier.Pure) lines.push(" * @pureOrBreakMyCode");
    for (let i = 0; i < this.params.length; i++) {
      const param = this.params[i]!;
      const label = this.paramNames?.[i] ?? "arg" + i;
      const isOptional = i >= this.optionalAfter;
      if (this.rest && i === lastIdx) {
        const restType = param.toTsExpr({ bare: true });
        lines.push(` * @param {...${restType}} ${label}`);
      } else {
        const typeStr = param.toTsExpr({ toParam: isOptional });
        lines.push(` * @param {${typeStr}} ${label}`);
      }
    }
    const returnTypeStr = this.returnType.toTsExpr();
    lines.push(` * @return {${returnTypeStr}}`);
    return "/**\n" + lines.join("\n") + "\n */";
  }

  override toTsExpr({ toParam, wrap, bare }: Context = {}): string {
    const modifiers = bare ? 0 : this.modifiers;
    const lastIdx = this.params.length - 1;
    const paramParts = this.params.map((param, i) => {
      const label = this.paramNames?.[i] ?? "arg" + i;
      if (this.rest && i === lastIdx)
        return "..." + label + ": " + param.toTsExpr({ bare: true });
      const isOptional = i >= this.optionalAfter;
      return (
        label + ": " + param.toTsExpr({ toParam: isOptional, wrap: true })
      );
    });
    const paramTypes = paramParts.join(", ");
    const returnTypeStr = this.returnType.toTsExpr({ wrap: true });
    let functionType = "";
    if (this.thisType) {
      const thisStr = this.thisType.toTsExpr({ bare: true });
      functionType = `(this: ${thisStr}${paramTypes ? ", " + paramTypes : ""})`;
    } else
      functionType = `(${paramTypes})`;
    if (!(this.returnType instanceof PrimitiveType &&
      this.returnType.name === PrimitiveTypeName.Undefined))
      functionType += ` => ${returnTypeStr}`;
    else
      functionType += " => void";
    if (modifiers & Modifier.Nullable || (!!(modifiers & Modifier.Optional) && !toParam))
      functionType = "(" + functionType + ")";
    if (modifiers & Modifier.Nullable) functionType += " | null";
    if (modifiers & Modifier.Optional) {
      functionType += toParam ? "=" : " | undefined";
      if (!toParam && wrap) functionType = "(" + functionType + ")";
    }
    return functionType;
  }

  isMethod(): boolean { return !!this.thisType; }
}

class ConstructorType extends FunctionType {
  extendsType: Type | null;
  implementsTypes: Type[] | null;

  constructor(
    instanceType: Type,
    extendsType: Type | null,
    implementsTypes: Type[] | null,
    params: Type[],
    paramNames?: string[],
    rest?: boolean,
    optionalAfter?: number
  ) {
    super(
      params,
      paramNames,
      new PrimitiveType(PrimitiveTypeName.Undefined),
      rest ?? false,
      optionalAfter,
      instanceType
    );
    this.extendsType = extendsType;
    this.implementsTypes = implementsTypes;
  }

  override toClosureExpr(context: Context): string {
    return super.toClosureExpr(context).replace("this:", "new:");
  }

  override toTsExpr(context: Context): string {
    return super.toTsExpr(context).replace("this:", "new:");
  }
}

const BigIntType = new PrimitiveType(PrimitiveTypeName.BigInt);
const BooleanType = new PrimitiveType(PrimitiveTypeName.Boolean);
const NullType = new PrimitiveType(PrimitiveTypeName.Null);
const NumberType = new PrimitiveType(PrimitiveTypeName.Number);
const StringType = new PrimitiveType(PrimitiveTypeName.String);
const SymbolType = new PrimitiveType(PrimitiveTypeName.Symbol);
const UndefinedType = new PrimitiveType(PrimitiveTypeName.Undefined);

const AnyType = new TopType(TopTypeName.Any);
const UnknownType = new TopType(TopTypeName.Unknown);

export {
  AnyType,
  BigIntType,
  BooleanType,
  ConstructorType,
  FunctionType,
  GenericType,
  InstanceType,
  Modifier,
  NullType,
  NumberType,
  PrimitiveType,
  PrimitiveTypeName,
  StringType,
  StructType,
  SymbolType,
  TopType,
  TopTypeName,
  Type,
  UndefinedType,
  UnionType,
  UnknownType,
};

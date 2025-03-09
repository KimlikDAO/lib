/** @enum {number} */
const Modifier = {
  Nullable: 1,
  Optional: 2,

  PureOrBreakMyCode: 64,
  NoSideEffects: 128
};

class Type {
  /**
   * 
   * @param {number=} modifiers 
   */
  constructor(modifiers) {
    this.modifiers = modifiers || 0;
  }

  isNullable() {
    return (this.modifiers & Modifier.Nullable) !== 0;
  }

  toExpr() {
    throw new Error("Abstract method");
  }

  toClosureExpr() {
    throw new Error("Abstract method");
  }
}

/** @enum {string} */
const PrimitiveTypes = {
  String: "string",
  Number: "number",
  Boolean: "boolean",
  Symbol: "symbol",
  BigInt: "bigint",
  Undefined: "undefined",
  Null: "null",
  Void: "void"
};

class PrimitiveType extends Type {
  /**
   * @param {string} name
   * @param {boolean=} isNullable
   */
  constructor(name, isNullable = false) {
    super(isNullable ? Modifier.Nullable : 0);
    this.name = name;
  }

  toExpr() {
    return (this.isNullable() ? "?" : "") + this.name
  }

  toClosureExpr() { return this.toExpr(); }
}

class InstanceType extends Type {
  /**
   * @param {string} name
   * @param {boolean} isNullable
   */
  constructor(name, isNullable) {
    super(isNullable ? Modifier.Nullable : 0);
    this.name = name;
  }

  toExpr() {
    return (this.isNullable() ? "?" : "") + this.name;
  }

  toClosureExpr() {
    return (this.isNullable() ? "" : "!") + this.name;
  }
}

class UnionType extends Type {
  /**
   * @param {!Array<!Type>} types
   */
  constructor(types) {
    const idx = types.findIndex((type) =>
      type instanceof PrimitiveType && type.name == PrimitiveTypes.Null);
    if (idx != -1) {
      if (idx == types.length - 1) types.pop();
      else types[idx] = types.pop();
    }
    super(idx != -1 ? Modifier.Nullable : 0);
    this.types = types;
  }

  toExpr() {
    return this.types.map((t) => t.toExpr()).join(" | ") +
      (this.isNullable() ? " | null" : "");
  }

  toClosureExpr() {
    return this.types.map((t) => t.toClosureExpr()).join("|") +
      (this.isNullable() ? "|null" : "");
  }
}

/**
 * A type which takes other types as parameter. In google closure, these are
 * defined through the at-template keyword.
 */
class GenericType extends Type {
  /**
   * @param {string} name
   * @param {!Array<!Type>} params
   * @param {boolean} isNullable
   */
  constructor(name, params, isNullable) {
    super(isNullable ? Modifier.Nullable : 0);
    this.name = name;
    this.params = params;
  }

  toExpr() {
    const typeParams = this.params.map(p => p.toExpr()).join(", ");
    if (this.name === "Array" && this.params.length == 1)
      return this.isNullable() ? `?(${typeParams}[])` : `${typeParams}[]`;

    return `${this.isNullable() ? "?" : ""}${this.name}<${typeParams}>`;
  }

  toClosureExpr() {
    const typeParams = this.params.map(p => p.toClosureExpr()).join(",");
    return `${this.isNullable() ? "" : "!"}${this.name}<${typeParams}>`;
  }
}

class StructType extends Type {
  /**
   * @param {!Object<string, !Type>} members
   */
  constructor(members) {
    super();
    /** @const {!Object<string, !Type>} */
    this.members = members;
  }

  toExpr(indent = 2) {
    /** @const {string} */
    const pad = " ".repeat(indent);
    return "{\n" + Object.entries(this.members)
      .map(([name, /** @type {!Type} */ type]) => `${pad}${name}: ${type.toExpr()}`)
      .join(",\n") + "\n}";
  }
}

class FunctionType extends Type {
  /**
   * @param {!Array<!Type>} params
   * @param {!Type} returnType
   * @param {number=} optionalAfter
   * @param {Type=} thisType - The type of 'this' for methods
   */
  constructor(params, returnType, optionalAfter, thisType = null) {
    super();
    this.params = params;
    this.returnType = returnType;
    this.optionalAfter = optionalAfter ?? params.length;
    this.thisType = thisType;
  }

  toExpr() {
    return `function(${this.params.map((type, i) =>
      `${type.toExpr()}${i >= this.optionalAfter ? "=" : ""}`
    ).join(",")}):${this.returnType.toExpr()}`;
  }

  toJsDoc() {
    let counter = 0;
    const paramDocs = this.params.map((type, i) =>
      ` * @param {${type.toExpr()}${i >= this.optionalAfter ? "=" : ""}} param${++counter}`
    ).join("\n");
    return `/**\n${paramDocs}\n * @return {${this.returnType.toExpr()}}\n */`;
  }

  isMethod() {
    return this.thisType !== null;
  }
}

class ConstructorType extends FunctionType {
  /**
   * @param {!Type} instanceType
   * @param {Type} extendsType
   * @param {!Array<!Type>} implementsTypes
   * @param {!Array<!Type>} params
   * @param {number=} optionalAfter
   */
  constructor(instanceType, extendsType, implementsTypes, params, optionalAfter) {
    super(params, instanceType, optionalAfter);
    this.extendsType = extendsType;
    this.implementsTypes = implementsTypes;
  }

  toExpr() {
    const paramStr = this.params.map(p => p.toExpr()).join(", ");
    return `new(${paramStr}) => ${this.returnType.toExpr()}`;
  }

  toClosureExpr() {
    const paramStr = this.params.map(p => p.toClosureExpr()).join(",");
    return `function(new:${this.returnType.toClosureExpr()}${paramStr ? "," + paramStr : ""})`;
  }
}

export {
  ConstructorType,
  FunctionType,
  GenericType,
  InstanceType, Modifier, PrimitiveType, PrimitiveTypes, StructType,
  Type,
  UnionType
};


/** @enum {number} */
const Modifier = {
  Nullable: 1,
  Optional: 2,
  Readonly: 4,

  PureOrBreakMyCode: 64,
  NoSideEffects: 128
};

/**
 * Removes nullable/non-nullable prefixes (? and !) from a type string
 * @param {string} typeStr The type string to process
 * @return {string} The type string without prefixes
 */
const bareType = (typeStr) =>
  typeStr.startsWith('!') || typeStr.startsWith('?')
    ? typeStr.substring(1) : typeStr;

/**
 * @typedef {{
 *   toParam: (boolean|undefined),
 *   wrap: (boolean|undefined),
 * }} Context
 */
const Context = {};

class Type {
  /**
   * @param {number=} modifiers 
   */
  constructor(modifiers) {
    /** @type {number} */
    this.modifiers = modifiers || 0;
  }

  isNullable() {
    return (this.modifiers & Modifier.Nullable) !== 0;
  }

  isOptional() {
    return (this.modifiers & Modifier.Optional) !== 0;
  }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr(context) {
    throw new Error("Abstract method" + context);
  }
}

/** @enum {string} */
const PrimitiveTypes = {
  Any: "?",
  BigInt: "bigint",
  Boolean: "boolean",
  Null: "null",
  Number: "number",
  String: "string",
  Symbol: "symbol",
  Undefined: "undefined",
  Unknown: "*",
  Void: "void",
};

class PrimitiveType extends Type {
  /**
   * @param {string} name
   */
  constructor(name) {
    super();
    this.name = name;
  }

  /**
   * @override
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam } = {}) {
    const modifiers = this.modifiers;
    const prefix = modifiers & Modifier.Nullable ? "?" : "";
    return prefix + this.name +
      ((modifiers & Modifier.Optional) ? (toParam ? "=" : "|undefined") : "");
  }
}

class InstanceType extends Type {
  /**
   * @param {string} name
   */
  constructor(name) {
    super();
    this.name = name;
  }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam } = {}) {
    const modifiers = this.modifiers;
    const prefix = modifiers & Modifier.Nullable ? "" : "!";
    return prefix + this.name +
      ((modifiers & Modifier.Optional) ? (toParam ? "=" : "|undefined") : "");
  }
}

class UnionType extends Type {
  /**
   * @param {!Array<!Type>} types
   */
  constructor(types) {
    const nullIdx = types.findIndex((type) =>
      type instanceof PrimitiveType && type.name == PrimitiveTypes.Null);
    if (nullIdx != -1) {
      if (nullIdx == types.length - 1) types.pop();
      else types[nullIdx] = types.pop();
    }
    const undefIdx = types.findIndex((type) =>
      type instanceof PrimitiveType && type.name == PrimitiveTypes.Undefined);
    if (undefIdx != -1) {
      if (undefIdx == types.length - 1) types.pop();
      else types[undefIdx] = types.pop();
    }
    super(
      (nullIdx == -1 ? 0 : Modifier.Nullable) |
      (undefIdx == -1 ? 0 : Modifier.Optional)
    );
    this.types = types;
  }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam, wrap } = {}) {
    const modifiers = this.modifiers;
    const types = this.types
      .map((t) => t.toClosureExpr())
      .join("|");
    let expr = types + (modifiers & Modifier.Nullable ? "|null" : "");
    const optional = modifiers & Modifier.Optional;
    if (toParam)
      return `(${expr})${optional ? "=" : ""}`;
    if (optional)
      expr = expr + "|undefined";
    return wrap ? `(${expr})` : expr;
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
   */
  constructor(name, params) {
    super();
    this.name = name;
    this.params = params;
  }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam } = {}) {
    const modifiers = this.modifiers;
    const typeParams = this.params.map(p => p.toClosureExpr()).join(",");
    const typeName = this.name === "Record" ? "Object" : this.name;
    return `${modifiers & Modifier.Nullable ? "" : "!"}${typeName}<${typeParams}>`
      + (modifiers & Modifier.Optional ? toParam ? "=" : "|undefined" : "");
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

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam } = {}) {
    const members = this.members;
    const modifiers = this.modifiers;
    let expr = "";
    let sep = ""
    for (const key in members) {
      expr += `${sep}${key}: ${members[key].toClosureExpr({ wrap: true })}`;
      sep = ", ";
    }
    return `${modifiers & Modifier.Nullable ? "?" : ""}{ ${expr} }`
      + (modifiers & Modifier.Optional ? toParam ? "=" : "|undefined" : "");
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

  toJsDoc() { }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam } = {}) {
    const modifiers = this.modifiers;

    const paramTypes = this.params.map((param, i) => {
      const isOptional = i >= this.optionalAfter;
      return param.toClosureExpr({ toParam: isOptional, wrap: true });
    }).join(", ");

    const returnTypeStr = this.returnType.toClosureExpr({ wrap: true });

    // Build function type
    let functionType = "";

    // Add this type for methods
    if (this.thisType) {
      const thisTypeStr = bareType(this.thisType.toClosureExpr());
      functionType = `function(this:${thisTypeStr}${paramTypes ? ", " + paramTypes : ""})`;
    } else {
      functionType = `function(${paramTypes})`;
    }

    // Add return type if not void
    if (!(this.returnType instanceof PrimitiveType &&
      this.returnType.name === PrimitiveTypes.Void)) {
      functionType += `: ${returnTypeStr}`;
    }

    // Add optional/nullable modifiers
    return functionType +
      (modifiers & Modifier.Optional ? (toParam ? "=" : "|undefined") : "");
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

  toClosureExpr() {
    const paramStr = this.params.map(p => p.toClosureExpr()).join(",");
    return `function(new:${this.returnType.toClosureExpr()}${paramStr ? "," + paramStr : ""})`;
  }
}

export {
  ConstructorType,
  FunctionType,
  GenericType,
  InstanceType,
  Modifier,
  PrimitiveType,
  PrimitiveTypes,
  StructType,
  Type,
  UnionType
};

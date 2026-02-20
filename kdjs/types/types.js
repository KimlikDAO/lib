/** @enum {number} */
const Modifier = {
  Nullable: 1,
  Optional: 2,
  Readonly: 4,

  NoSideEffects: 64,
  PureOrBreakMyCode: 128,
};

/**
 * Removes nullable/non-nullable prefixes (? and !) from a type string
 * @param {string} typeStr The type string to process
 * @return {string} The type string without prefixes
 */
const stripModifiers = (typeStr) =>
  typeStr.startsWith('!') || typeStr.startsWith('?')
    ? typeStr.substring(1) : typeStr;

/**
 * @typedef {{
 *   toParam?: boolean,
 *   wrap?: boolean,
 *   bare?: boolean
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

  /** @return {boolean} */
  isNullable() {
    return !!(this.modifiers & Modifier.Nullable);
  }

  /** @return {boolean} */
  isOptional() {
    return !!(this.modifiers & Modifier.Optional);
  }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr(context) {
    throw new Error("Abstract method" + context);
  }

  /**
   * @param {UnionType} union
   */
  addToUnion(union) {
    union.addSingle(this);
  }
}

class UnionType extends Type {
  /**
   * @param {Type[]=} types
   */
  constructor(types) {
    super();
    /** @type {Map<string, Type>} */
    this.typeMap = new Map();

    if (types)
      for (const type of types)
        type.addToUnion(this);
  }

  clear() {
    this.typeMap.clear();
  }

  /** @return {Type[]} */
  get types() {
    return Array.from(this.typeMap.values());
  }

  /**
   * @override
   * @param {UnionType} union 
   */
  addToUnion(union) {
    union.modifiers |= this.modifiers;
    for (const type of this.typeMap.values())
      type.addToUnion(union);    
  }

  /**
   * @param {Type} type
   */
  addSingle(type) {
    this.modifiers |= type.modifiers;
    this.typeMap.set(type.toClosureExpr({ bare: true }), type);
  }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam, wrap, bare } = {}) {
    const modifiers = bare ? 0 : this.modifiers;

    if (this.typeMap.size == 1) {
      const type = this.typeMap.values().next().value;
      if (type instanceof TopType)
        return type.toClosureExpr({ toParam }); 
    }

    let expr = "";
    let separator = "";
    for (const type of this.typeMap.values()) {
      expr += separator + type.toClosureExpr({ bare: true });
      separator = "|";
    }
    if (modifiers & Modifier.Nullable)
      expr += "|null";
    if ((modifiers & Modifier.Optional) && !toParam)
      expr += "|undefined";
    if (wrap && ( // Count whether we've added >1 types into the closure expression.
      this.typeMap.size > 1
      || modifiers & Modifier.Nullable 
      || modifiers & Modifier.Optional && !toParam
    ))
      expr = `(${expr})`;
    if ((modifiers & Modifier.Optional) && toParam)
      expr += "=";

    return expr;
  }
}

/** @enum {string} */
const PrimitiveTypeName = {
  BigInt: "bigint",
  Boolean: "boolean",
  Null: "null",
  Number: "number",
  String: "string",
  Symbol: "symbol",
  Undefined: "undefined",
};

/** @enum {string} */
const TopTypeName = {
  Any: "?",
  Unknown: "*",
};

class PrimitiveType extends Type {
  /**
   * @param {PrimitiveTypeName} name
   */
  constructor(name) {
    const modifiers = (name == PrimitiveTypeName.Null)
      ? Modifier.Nullable : (name == PrimitiveTypeName.Undefined) 
        ? Modifier.Optional : 0;
    super(modifiers);
    /** @const {PrimitiveTypeName} */
    this.name = name;
  }

  /**
   * @override
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam, bare, wrap } = {}) {
    const modifiers = bare ? 0 : this.modifiers;
    let expr = this.name;
    if (modifiers & Modifier.Nullable && this.name != PrimitiveTypeName.Null)
      expr = "?" + expr;
    if (modifiers & Modifier.Optional) {
      const addingUndefined = !toParam && this.name != PrimitiveTypeName.Undefined;
      expr += addingUndefined ? "|undefined" 
        : toParam ? "=" : "";
      if (wrap && addingUndefined)
        expr = `(${expr})`;
    }
    return expr;
  }

  addToUnion(union) {
    if (this.name === PrimitiveTypeName.Null || this.name === PrimitiveTypeName.Undefined)
      union.modifiers |= this.modifiers;
    else
      union.addSingle(this);
  }
}

class TopType extends Type {
  /**
   * @param {TopTypeName} name
   */
  constructor(name) {
    super(Modifier.Nullable | Modifier.Optional);
    /** @const {TopTypeName} */
    this.name = name;
  }

  /**
   * @param {UnionType} union 
   */
  addToUnion(union) {
    union.clear();
    union.addSingle(this);
  }

  /**
   * @override
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam } = {}) {
    return this.name + (toParam ? "=" : "");
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
  toClosureExpr({ toParam, bare, wrap } = {}) {
    const modifiers = bare ? 0 : this.modifiers;
    let expr = this.name;
    expr = (modifiers & Modifier.Nullable ? "?" : "!") + expr;
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : "|undefined";
      if (!toParam && wrap)
        expr = `(${expr})`;
    }
    return expr;
  }
}

/**
 * A type which takes other types as parameter. In google closure, these are
 * defined through the at-template keyword.
 */
class GenericType extends Type {
  /**
   * @param {string} name
   * @param {Type[]} params
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
  toClosureExpr({ toParam, bare, wrap } = {}) {
    const modifiers = bare ? 0 : this.modifiers;

    // Build base expression
    const typeName = this.name == "Record" ? "Object" : this.name;
    const typeParams = this.params.map(p => p.toClosureExpr()).join(",");
    let expr = `${typeName}<${typeParams}>`;
    if (!(modifiers & Modifier.Nullable))
      expr = "!" + expr;
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : "|undefined";
      if (!toParam && wrap)
        expr = `(${expr})`;
    }
    return expr;
  }
}

class StructType extends Type {
  /**
   * @param {Record<string, Type>} members
   */
  constructor(members) {
    super();
    /** @const {Record<string, Type>} */
    this.members = members;
  }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam, wrap, bare } = {}) {
    const modifiers = bare ? 0 : this.modifiers;
    const members = this.members;
    let expr = "";
    let sep = "";
    for (const key in members) {
      expr += `${sep}${key}: ${members[key].toClosureExpr({ wrap: true })}`;
      sep = ", ";
    }
    expr = `{ ${expr} }`;

    if (modifiers & Modifier.Nullable)
      expr = "?" + expr;
    if (modifiers & Modifier.Optional) {
      expr += toParam ? "=" : "|undefined";
      if (!toParam && wrap)
        expr = `(${expr})`;
    }
    return expr;
  }
}

class FunctionType extends Type {
  /**
   * @param {Type[]} params
   * @param {Type} returnType
   * @param {boolean=} rest
   * @param {number=} optionalAfter
   * @param {Type=} thisType - The type of 'this' for methods
   */
  constructor(params, returnType, rest = false, optionalAfter, thisType) {
    super();
    /** @const {Type[]} */
    this.params = params;
    /** @const {Type} */
    this.returnType = returnType;
    /** @const {boolean} */
    this.rest = rest;
    /** @const {number} */
    this.optionalAfter = optionalAfter ?? params.length;
    /** @const {Type | undefined} */
    this.thisType = thisType;
  }

  toJsDoc() { }

  /**
   * @param {Context=} context
   * @return {string}
   */
  toClosureExpr({ toParam, wrap, bare } = {}) {
    const modifiers = bare ? 0 : this.modifiers;

    const lastIdx = this.params.length - 1;
    const paramTypes = this.params.map((param, i) => {
      if (this.rest && i == lastIdx)
        return "..." + param.toClosureExpr({ bare: true });
      const isOptional = i >= this.optionalAfter;
      return param.toClosureExpr({ toParam: isOptional, wrap: true });
    }).join(", ");

    const returnTypeStr = this.returnType.toClosureExpr({ wrap: true });

    // Build function type
    let functionType = "";

    // Add this type for methods
    if (this.thisType) {
      const thisTypeStr = stripModifiers(this.thisType.toClosureExpr());
      functionType = `function(this:${thisTypeStr}${paramTypes ? ", " + paramTypes : ""})`;
    } else {
      functionType = `function(${paramTypes})`;
    }

    // Add return type if not void
    if (!(this.returnType instanceof PrimitiveType &&
      this.returnType.name == PrimitiveTypeName.Undefined)) {
      functionType += `: ${returnTypeStr}`;
    }

    if (modifiers & Modifier.Nullable)
      functionType = "?" + functionType;
    if (modifiers & Modifier.Optional) {
      functionType += toParam ? "=" : "|undefined";
      if (!toParam && wrap)
        functionType = `(${functionType})`;
    }
    return functionType;
  }

  /** @return {boolean} */
  isMethod() {
    return !!this.thisType;
  }
}

class ConstructorType extends FunctionType {
  /**
   * @param {Type} instanceType
   * @param {Type | null} extendsType
   * @param {Type[] | null} implementsTypes
   * @param {Type[]} params
   * @param {boolean} rest
   * @param {number=} optionalAfter
   */
  constructor(instanceType, extendsType, implementsTypes, params, rest, optionalAfter) {
    super(params, new PrimitiveType(PrimitiveTypeName.Undefined), rest, optionalAfter, instanceType);
    this.extendsType = extendsType;
    this.implementsTypes = implementsTypes;
  }

  toClosureExpr(context) {
    return super.toClosureExpr(context).replace("this:", "new:");
  }
}

export {
  ConstructorType,
  FunctionType,
  GenericType,
  InstanceType,
  Modifier,
  PrimitiveType,
  PrimitiveTypeName,
  StructType,
  TopType,
  TopTypeName,
  Type,
  UnionType
};

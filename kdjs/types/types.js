
/** @enum {number} */
const Modifier = {
  Nullable: 1,

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
    return this.modifiers & Modifier.Nullable;
  }
}

class PrimitiveType extends Type {
  /**
   * @param {string} name
   * @param {boolean=} isNullable
   */
  constructor(name, isNullable = false) {
    super(isNullable ? Modifier.Nullable : 0);
    this.name = name;
  }

  toString() {
    return (this.isNullable() ? "?" : "") + this.name
  }
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

  toString() {
    return (this.isNullable() ? "" : "!") + this.name
  }
}

class UnionType extends Type {
  /**
   * @param {!Array<!Type>} types
   */
  constructor(types) {
    const idx = types.findIndex((type) =>
      type instanceof PrimitiveType && type.name == "null");
    if (idx != -1) {
      if (idx == types.length - 1) types.pop();
      else types[idx] = types.pop();
    }
    super(idx != -1 ? Modifier.Nullable : 0);
    this.types = types;
  }

  toString() {
    return this.types.join(" | ") + (this.isNullable() ? " | null" : "");
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

  toString() {
    const typeParams = this.params.map((param) => param.toString()).join(", ")
    return `${(this.isNullable() ? "" : "!") + this.name}<${typeParams}>`;
  }
}

class RecordType extends Type {
  /**
   * @param {!Object<string, !Type>} members
   */
  constructor(members) {
    super();
    this.members = members;
  }

  toString(indent = 2) {
    /** @const {string} */
    const pad = " ".repeat(indent);
    return "{\n" + Object.entries(this.members)
      .map(([name, type]) => `${pad}${name}: ${type.toString()}`)
      .join(",\n") + "\n}";
  }
}

class FunctionType extends Type {
  /**
   * @param {!Type} returnType
   * @param {!Array<!Type>} params
   * @param {number=} optionalAfter
   */
  constructor(returnType, params, optionalAfter) {
    super();
    this.returnType = returnType;
    this.params = params;
    this.optionalAfter = optionalAfter ?? params.length;
  }

  toString() {
    return `function(${this.params.map((type, i) =>
      `${type.toString()}${i >= this.optionalAfter ? "=" : ""}`
    ).join(",")}):${this.returnType.toString()}`;
  }

  toJsDoc() {
    let counter = 0;
    const paramDocs = this.params.map((type, i) =>
      ` * @param {${type.toString()}${i >= this.optionalAfter ? "=" : ""}} param${++counter}`
    ).join("\n");
    return `/**\n${paramDocs}\n * @return {${this.returnType.toString()}}\n */`;
  }
}

export {
  FunctionType,
  GenericType,
  InstanceType,
  PrimitiveType,
  RecordType,
  Type,
  UnionType
};

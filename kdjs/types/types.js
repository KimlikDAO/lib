
class Type { }

class PrimitiveType extends Type {
  /**
   * @param {string} name
   * @param {boolean} isNullable
   */
  constructor(name, isNullable) {
    this.name = name;
    this.isNullable = isNullable;
  }

  toString() {
    return (this.isNullable ? "?" : "") + this.name
  }

}

class InstanceType extends Type {
  /**
   * @param {string} name
   * @param {boolean} isNullable
   */
  constructor(name, isNullable) {
    this.name = name;
    this.isNullable = isNullable;
  }

  toString() {
    return (this.isNullable ? "" : "!") + this.name
  }
}

class UnionType extends Type {
  /**
   * @param {!Array<!Type>} types
   */
  constructor(types) {
    this.types = types;
  }

  toString() {
    return this.types.join(" | ");
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
    this.name = name;
    this.params = params;
  }

  toString() {
    return `${this.name}<${this.params.toString()}>`;
  }
}

class RecordType extends Type {
  /**
   * @param {!Object<string, !Type>} members
   */
  constructor(members) {
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
   * @param {number} optionalAfter
   */
  constructor(returnType, params, optionalAfter) {
    this.returnType = returnType;
    this.params = params;
    this.optionalAfter = optionalAfter;
  }

  toString() {
    return `function(${this.params.join(",")}):${this.returnType.toString()}`;
  }

  toJsDoc() {

  }
}

export {
  FunctionType,
  GenericType,
  InstanceType,
  PrimitiveType,
  RecordType,
  Type,
  UnionType,
};

import {
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
} from "./types";

/** @type {!Set<string>} */
const PrimitiveNames = new Set(Object.values(PrimitiveTypeName));

/** @type {!Map<string, string>} */
const TopTypeNames = new Map([
  ["any", TopTypeName.Any],
  ["unknown", TopTypeName.Unknown]
]);

/**
 * A parser for type expressions
 */
class Parser {
  /**
   * @param {string} input The input string to parse
   * @param {number=} pos The starting position (defaults to 0)
   */
  constructor(input, pos = 0) {
    /** @const {string} */
    this.input = input;
    /** @private {number} */
    this.pos = pos;
  }

  /**
   * Skips whitespace characters
   */
  skipWhitespace() {
    for (; this.pos < this.input.length; ++this.pos) {
      const ch = this.input.charCodeAt(this.pos);
      if (ch != 32 && ch != 9 && ch != 10 && ch != 13)
        break;
    }
  }

  /**
   * Skips whitespace and expects a specific character
   * @param {number} ch The expected character code
   */
  expectChar(ch) {
    this.skipWhitespace();
    if (this.pos >= this.input.length || this.input.charCodeAt(this.pos) !== ch) {
      throw `Expected '${String.fromCharCode(ch)}' at position ${this.pos}`;
    }
    this.pos++; // skip expected character
  }

  /**
   * Skips whitespace and expects either of two specific characters
   * @param {number} ch1 The first expected character code
   * @param {number} ch2 The second expected character code
   * @return {boolean} Whether the second character was found (true) or the first (false)
   */
  expectEitherChar(ch1, ch2) {
    this.skipWhitespace();
    if (this.pos >= this.input.length || (this.input.charCodeAt(this.pos) != ch1 && this.input.charCodeAt(this.pos) != ch2)) {
      throw `Expected '${String.fromCharCode(ch1)}' or '${String.fromCharCode(ch2)}' at position ${this.pos}`;
    }
    return this.input.charCodeAt(this.pos++) == ch2;
  }

  /**
   * Skips whitespace and expects a specific string
   * @param {string} value The expected string
   */
  expect(value) {
    this.skipWhitespace();
    if (this.input.slice(this.pos, this.pos + value.length) != value)
      throw `Expected '${value}' at position ${this.pos}`;
    this.pos += value.length;
  }

  /**
   * Skips whitespace and consumes a character if present
   * @param {number} ch The character code to consume
   * @return {boolean} Whether the character was consumed
   */
  testChar(ch) {
    this.skipWhitespace();
    if (this.input.charCodeAt(this.pos) == ch) {
      this.pos++;
      return true;
    }
    return false;
  }

  /**
   * Reads an identifier
   * @return {string} The identifier
   */
  readIdentifier() {
    this.skipWhitespace();
    let i = this.pos;
    for (; i < this.input.length; ++i) {
      const ch = this.input.charCodeAt(i);
      // a-z: 97-122, A-Z: 65-90, 0-9: 48-57, _: 95, $: 36, .: 46
      if (!((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) ||
            (ch >= 48 && ch <= 57) || ch == 95 || ch == 36 || ch == 46))
        break;
    }
    if (i == this.pos)
      throw `Expected identifier at position ${this.pos}`;
    return this.input.slice(this.pos, this.pos = i);
  }

  /**
   * Detects whether the upcoming paren group is a function type
   * @return {boolean} Whether the group is a function type
   */
  detectFunctionType() {
    let i = this.pos + 1;
    for (let parenLevel = 1; i < this.input.length; ++i) {
      const ch = this.input.charCodeAt(i);
      if (ch == 40) parenLevel++;
      else if (ch == 41 && --parenLevel == 0) break;
    }
    for (; ++i < this.input.length;) {
      const ch = this.input.charCodeAt(i);
      if (ch != 32 && ch != 9 && ch != 10 && ch != 13)
        break;
    }
    return this.input.slice(i, i + 2) == "=>";
  }

  /**
   * Parses a function type expression
   * @return {!FunctionType} The parsed function type
   * @throws {Error} If parsing fails
   */
  parseFunctionType() {
    /** @const {!Array<!Type>} */
    const params = [];
    let optionalAfter = 1e9;
    /** @type {Type} */
    let thisType = null;

    this.expectChar("(".charCodeAt(0));
    if (!this.testChar(")".charCodeAt(0)))
      for (; ;) {
        const paramName = this.readIdentifier();

        let isOptional = this.testChar("?".charCodeAt(0));
        this.expectChar(":".charCodeAt(0));
        const paramType = this.parseType();
        isOptional |= this.testChar("=".charCodeAt(0));

        if (isOptional) {
          paramType.modifiers |= Modifier.Optional;
          if (params.length < optionalAfter)
            optionalAfter = params.length;
        }

        if (paramName == "this") {
          thisType = paramType;
          if (params.length != 0)
            throw `'this' parameter must be the first parameter at position ${this.pos}`;
        } else
          params.push(paramType);
        if (this.expectEitherChar(",".charCodeAt(0), ")".charCodeAt(0)))
          break;
      }

    this.expect("=>");
    const returnType = this.parseType();
    if (optionalAfter == 1e9)
      optionalAfter = params.length;

    return new FunctionType(params, returnType, optionalAfter, thisType);
  }

  /**
   * Parses a struct/object type
   * @return {!StructType} The parsed struct type
   * @throws {Error} If parsing fails
   */
  parseStructType() {
    const members = {};
    this.expectChar("{".charCodeAt(0));
    if (!this.testChar("}".charCodeAt(0)))
      for (; ;) {
        const propName = this.readIdentifier();
        let isOptional = propName.endsWith("$") | this.testChar("?".charCodeAt(0));
        this.expectChar(":".charCodeAt(0));
        const propType = this.parseType();
        isOptional |= this.testChar("=".charCodeAt(0));

        if (isOptional)
          propType.modifiers |= Modifier.Optional;
        members[propName] = propType;

        if (this.expectEitherChar(",".charCodeAt(0), "}".charCodeAt(0)))
          break;
      }
    return new StructType(members);
  }

  /**
   * @return {!Type}
   * @throws {Error}
   */
  parseNamedType() {
    const name = this.readIdentifier();
    const topTypeName = TopTypeNames.get(name);
    if (topTypeName)
      return new TopType(topTypeName);

    const primitiveName = name == "void" ? "undefined" : name;
    if (PrimitiveNames.has(primitiveName))
      return new PrimitiveType(primitiveName);

    const params = this.parseTypeParams();
    if (params)
      return new GenericType(name, params);
    return new InstanceType(name);
  }

  /**
   * Parses a type expression
   * @return {!Type} The parsed type
   * @throws {Error} If parsing fails
   */
  parseType() {
    const union = new UnionType();
    for (; ;) {
      let isNullable = this.testChar("?".charCodeAt(0));
      let type;

      if (this.pos >= this.input.length)
        break;

      switch(this.input.charCodeAt(this.pos)) {
        case "(".charCodeAt(0):
          if (this.detectFunctionType())
            type = this.parseFunctionType();
          else {
            this.pos++; // skip (
            type = this.parseType();
            this.expectChar(")".charCodeAt(0));
          }
          break;
        case "{".charCodeAt(0):
          type = this.parseStructType();
          break;
        default:
          type = this.parseNamedType();
      }

      while (this.testChar("[".charCodeAt(0))) {
        this.expectChar("]".charCodeAt(0));
        const arrayType = new GenericType("Array", [type]);
        if (type.modifiers & Modifier.Nullable)
          arrayType.modifiers |= Modifier.Nullable;
        type = arrayType;
      }

      isNullable |= this.testChar("?".charCodeAt(0));
      if (isNullable)
        type.modifiers |= Modifier.Nullable;

      type.addToUnion(union);
      if (!this.testChar("|".charCodeAt(0)))
        break;
    }

    if (union.typeMap.size == 1) {
      const type = union.typeMap.values().next().value;
      type.modifiers |= union.modifiers;
      return type;
    } else if (union.typeMap.size == 0)
      return new PrimitiveType(union.isNullable()
        ? PrimitiveTypeName.Null : PrimitiveTypeName.Undefined);

    return union;
  }

  /**
   * Parses type parameters
   * @return {Array<!Type>} The parsed type parameters
   * @throws {Error} If parsing fails
   */
  parseTypeParams() {
    const params = [];
    if (!this.testChar("<".charCodeAt(0)))
      return null;
    for (; ;) {
      params.push(this.parseType());
      if (this.expectEitherChar(",".charCodeAt(0), ">".charCodeAt(0)))
        break;
    }
    return params;
  }

  /**
   * Gets the current position in the input
   * @return {number} The current position
   */
  getPosition() {
    return this.pos;
  }
}

/**
 * Parses a type expression and returns both the parsed type and the position where parsing ended
 * @param {string} input The input string to parse
 * @param {number=} startPos Optional starting position (defaults to 0)
 * @return {{type: !Type, endPos: number}} The parsed type and the position where parsing ended
 * @throws {Error} If parsing fails
 */
const parseTypePrefix = (input, startPos = 0) => {
  const parser = new Parser(input, startPos);
  const type = parser.parseType();
  const endPos = parser.getPosition();
  return { type, endPos };
};

/**
 * Parses a type expression and returns only the parsed type
 * @param {string} input The input string to parse
 * @return {!Type} The parsed type
 * @throws {Error} If parsing fails
 */
const parseType = (input) => new Parser(input).parseType();

export {
  Parser,
  parseTypePrefix,
  parseType
};

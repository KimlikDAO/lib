import {
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
} from "./types";

/** @type {Set<string>} */
const PrimitiveNames = new Set(Object.values(PrimitiveTypeName));

/** @type {Map<string, string>} */
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
   * Skips whitespace characters (including * for JSDoc continuation)
   */
  skipWhitespace() {
    for (; this.pos < this.input.length; ++this.pos) {
      const ch = this.input.charCodeAt(this.pos);
      if (ch != 32 && ch != 9 && ch != 10 && ch != 13 && ch != 42)
        break;
    }
  }

  /**
   * Skips whitespace and expects a specific character
   * @param {number} ch The expected character code
   */
  expectChar(ch) {
    this.skipWhitespace();
    if (this.input.charCodeAt(this.pos) != ch)
      throw `Expected '${String.fromCharCode(ch)}' at position ${this.pos}`;
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
    if (this.input.charCodeAt(this.pos) != ch1 && this.input.charCodeAt(this.pos) != ch2)
      throw `Expected '${String.fromCharCode(ch1)}' or '${String.fromCharCode(ch2)}' at position ${this.pos}`;
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

  test(value) {
    this.skipWhitespace();
    if (this.input.slice(this.pos, this.pos + value.length) == value) {
      this.pos += value.length;
      return true;
    }
    return false;
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
  parseIdentifier() {
    this.skipWhitespace();
    let i = this.pos;
    for (; i < this.input.length; ++i) {
      const ch = this.input.charCodeAt(i);
      if (!((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) ||
        (ch > 127) ||
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
   * Parses a constructor type expression
   * @return {ConstructorType | null} The parsed constructor type
   * @throws {Error} If parsing fails
   */
  parseConstructorType() {
    if (!this.test("new")) return null;
    const type = this.parseFunctionType();
    return new ConstructorType(
      type.returnType, null, null, type.params, type.rest, type.optionalAfter);
  }

  /**
   * Parses a function type expression
   * @return {FunctionType} The parsed function type
   * @throws {Error} If parsing fails
   */
  parseFunctionType() {
    /** @const {Type[]} */
    const params = [];
    let optionalAfter = 1e9;
    let rest = false;
    /** @type {Type | undefined} */
    let thisType = undefined;

    this.expectChar("(".charCodeAt(0));
    if (!this.testChar(")".charCodeAt(0)))
      for (; ;) {
        if (rest)
          throw `Rest parameter must be the last parameter at position ${this.pos}`;

        const isRest = this.test("...");
        const paramName = this.parseIdentifier();
        let isOptional = this.testChar("?".charCodeAt(0));
        this.expectChar(":".charCodeAt(0));
        let paramType = this.parseType();
        isOptional ||= this.testChar("=".charCodeAt(0));

        if (isRest) {
          rest = true;
          if (paramType instanceof GenericType && paramType.name == "Array")
            paramType = paramType.params[0];
        }

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

    return new FunctionType(params, returnType, rest, optionalAfter, thisType);
  }

  /**
   * Parses a struct/object type
   * @return {StructType} The parsed struct type
   * @throws {Error} If parsing fails
   */
  parseStructType() {
    const members = {};
    this.expectChar("{".charCodeAt(0));
    for (; ;) {
      if (this.testChar("}".charCodeAt(0)))
        break;
      const propName = this.parseIdentifier();
      let isOptional = propName.endsWith("$") || this.testChar("?".charCodeAt(0));
      this.expectChar(":".charCodeAt(0));
      const propType = this.parseType();
      isOptional ||= this.testChar("=".charCodeAt(0));

      if (isOptional)
        propType.modifiers |= Modifier.Optional;
      members[propName] = propType;

      if (this.expectEitherChar(",".charCodeAt(0), "}".charCodeAt(0)))
        break;
    }
    return new StructType(members);
  }

  /**
   * @return {Type}
   * @throws {Error}
   */
  parseNamedType() {
    const name = this.parseIdentifier();
    const topTypeName = TopTypeNames.get(name);
    if (topTypeName)
      return new TopType(/** @type {TopTypeName} */(topTypeName));

    const primitiveName = name == "void" ? "undefined" : name;
    if (PrimitiveNames.has(primitiveName))
      return new PrimitiveType(/** @type {PrimitiveTypeName} */(primitiveName));

    const params = this.parseTypeParams();
    if (params)
      return new GenericType(name, params);
    return new InstanceType(name);
  }

  /**
   * Parses a type expression
   * @return {Type} The parsed type
   * @throws {Error} If parsing fails
   */
  parseType() {
    const union = new UnionType();
    for (; ;) {
      let type;
      const isNullable = this.testChar("?".charCodeAt(0));
      let isNextArrayReadonly = this.test("readonly");
      if (isNextArrayReadonly)
        this.skipWhitespace();

      if (this.pos >= this.input.length)
        break;

      switch (this.input.charCodeAt(this.pos)) {
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
        case "n".charCodeAt(0):
          type = this.parseConstructorType();
          if (type)
            break;
        // fallthrough
        default:
          type = this.parseNamedType();
      }

      while (this.testChar("[".charCodeAt(0))) {
        this.expectChar("]".charCodeAt(0));
        type = new GenericType(isNextArrayReadonly ? "ReadonlyArray" : "Array", [type]);
        isNextArrayReadonly = false;
      }

      if (isNullable || this.testChar("?".charCodeAt(0)))
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
   * @return {Type[] | null} The parsed type parameters
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
 * Parses a type expression and returns both the parsed type and the position
 * where parsing ended
 *
 * @param {string} input The input string to parse
 * @param {number=} startPos Optional starting position (defaults to 0)
 * @return {{
 *   type: Type,
 *   endPos: number,
 *   paramOpt: boolean,
 *   paramRest: boolean
 * }} The parsed type and the position where parsing ended
 * @throws {Error} If parsing fails
 */
const parseTypePrefix = (input, startPos = 0) => {
  const parser = new Parser(input, startPos);
  const paramRest = parser.test("...");
  const type = parser.parseType();
  const paramOpt = parser.testChar("=".charCodeAt(0));
  if (paramOpt)
    type.modifiers |= Modifier.Optional;
  parser.skipWhitespace();
  const endPos = parser.getPosition();
  return { type, endPos, paramOpt, paramRest };
};

/**
 * Parses a type expression and returns only the parsed type
 *
 * @param {string} input The input string to parse
 * @return {Type} The parsed type
 * @throws {Error} If parsing fails
 */
const parseType = (input) => new Parser(input).parseType();

export {
  Parser,
  parseTypePrefix,
  parseType
};

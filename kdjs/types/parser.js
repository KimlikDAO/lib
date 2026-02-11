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
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos]))
      this.pos++;
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
    if (this.pos < this.input.length && this.input.charCodeAt(this.pos) === ch) {
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
    const match = /^[a-zA-Z0-9_$.]+/.exec(this.input.slice(this.pos));
    if (!match)
      throw `Expected identifier at position ${this.pos}`;
    this.pos += match[0].length;
    return match[0];
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
      for (;;) {
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

        const isOptional = propName.endsWith("$") | this.testChar("?".charCodeAt(0));
        this.expectChar(":".charCodeAt(0));
        const propType = this.parseType();
        if (isOptional)
          propType.modifiers |= Modifier.Optional;
        members[propName] = propType;

        if (this.expectEitherChar(",".charCodeAt(0), "}".charCodeAt(0)))
          break;
      }
    return new StructType(members);
  }

  /**
   * Parses a type expression
   * @return {!Type} The parsed type
   * @throws {Error} If parsing fails
   */
  parseType() {
    const union = new UnionType();
    for (; ;) {
      this.skipWhitespace();

      if (this.pos >= this.input.length)
        throw new Error(`Unexpected end of input at position ${this.pos}`);

      // Handle nullable prefix
      let isNullable = this.testChar("?".charCodeAt(0));
      let type;

      // Handle function types
      if (this.pos < this.input.length && this.input[this.pos] == '(') {
        // Look ahead to see if this is a function type or just a parenthesized type
        const startPos = this.pos;
        this.pos++; // skip (

        // Try to determine if this is a function type
        let isFunctionType = false;
        let parenLevel = 1;
        let foundArrow = false;

        // Simple lookahead to check for => after a closing parenthesis
        for (let i = this.pos; i < this.input.length && !foundArrow; i++) {
          if (this.input[i] == '(') parenLevel++;
          else if (this.input[i] == ')') {
            parenLevel--;
            if (parenLevel == 0) {
              // Check for => after the closing parenthesis
              for (let j = i + 1; j < this.input.length; j++) {
                if (/\s/.test(this.input[j])) continue;
                if (j + 1 < this.input.length && this.input[j] == '=' && this.input[j + 1] == '>') {
                  isFunctionType = true;
                  foundArrow = true;
                }
                break;
              }
            }
          }
        }

        // Reset position
        this.pos = startPos;

        if (isFunctionType) {
          type = this.parseFunctionType();
        } else {
          this.pos++; // skip (
          type = this.parseType();
          this.expectChar(")".charCodeAt(0));
        }
      }
      // Handle object types with braces
      else if (this.pos < this.input.length && this.input[this.pos] == '{') {
        type = this.parseStructType();
      } else {
        let name = this.readIdentifier();
        const topTypeName = TopTypeNames.get(name);
        if (topTypeName) {
          type = new TopType(topTypeName);
        } else if (name == "void") {
          type = new PrimitiveType(PrimitiveTypeName.Undefined);
        } else if (PrimitiveNames.has(name)) {
          type = new PrimitiveType(name);
        } else {
          // Handle generic types
          this.skipWhitespace();
          if (this.pos < this.input.length && this.input[this.pos] == '<') {
            const params = this.parseTypeParams();
            type = new GenericType(name, params);
          } else {
            type = new InstanceType(name);
          }
        }
      }

      // Handle array notation
      this.skipWhitespace();
      while (this.pos < this.input.length && this.input[this.pos] == '[') {
        this.pos++; // skip [
        this.expectChar("]".charCodeAt(0));

        // Convert Type[] to Array<Type>
        const arrayType = new GenericType("Array", [type]);
        // Transfer modifiers from the element type to the array type
        if (type.modifiers & Modifier.Nullable)
          arrayType.modifiers |= Modifier.Nullable;
        type = arrayType;
      }

      isNullable |= this.testChar("?".charCodeAt(0));
      if (isNullable)
        type.modifiers |= Modifier.Nullable;

      type.addToUnion(union);
      this.skipWhitespace();
      if (this.pos < this.input.length && this.input[this.pos] == '|')
        this.pos++; // skip |
      else break;
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
   * @return {!Array<!Type>} The parsed type parameters
   * @throws {Error} If parsing fails
   */
  parseTypeParams() {
    const params = [];
    this.expectChar("<".charCodeAt(0));
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

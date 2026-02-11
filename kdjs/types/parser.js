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
   * Reads an identifier
   * @return {string} The identifier
   */
  readIdentifier() {
    let ident = "";
    while (this.pos < this.input.length && /[a-zA-Z0-9_$]/.test(this.input[this.pos]))
      ident += this.input[this.pos++];
    return ident;
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

    // Handle empty parameter list
    this.skipWhitespace();
    if (this.input[this.pos] == ')') {
      this.pos++; // skip )
    } else {
      // Parse parameters
      let paramIndex = 0;

      while (this.pos < this.input.length && this.input[this.pos] !== ')') {
        this.skipWhitespace();

        // Read parameter name (required)
        const paramName = this.readIdentifier();
        if (!paramName)
          throw new Error(`Expected parameter name at position ${this.pos}`);

        this.skipWhitespace();

        // Check for optional parameter with ?
        let isOptional = false;
        if (this.pos < this.input.length && this.input[this.pos] == '?') {
          isOptional = true;
          this.pos++; // skip ?
          this.skipWhitespace();
        }

        // Expect colon after parameter name (or after ? if optional)
        if (this.pos >= this.input.length || this.input[this.pos] !== ':')
          throw new Error(`Expected ':' after parameter${isOptional ? ' optional marker' : ' name'} at position ${this.pos}`);
        this.pos++; // skip :
        this.skipWhitespace();

        // Special handling for 'this' parameter
        if (paramName == 'this' && paramIndex == 0) {
          thisType = this.parseType();

          // Skip to next parameter or end of list
          this.skipWhitespace();
          if (this.pos < this.input.length && this.input[this.pos] == ',') {
            this.pos++; // skip ,
            this.skipWhitespace();
            continue;
          } else if (this.pos < this.input.length && this.input[this.pos] == ')') {
            break;
          } else if (this.pos >= this.input.length) {
            throw new Error(`Unexpected end of input after 'this' parameter at position ${this.pos}`);
          } else {
            throw new Error(`Expected ',' or ')' after 'this' parameter at position ${this.pos}`);
          }
        }

        // Parse parameter type
        const paramType = this.parseType();

        // Check for optional parameter with =
        this.skipWhitespace();
        if (this.pos < this.input.length && this.input[this.pos] == '=') {
          isOptional = true;
          this.pos++; // skip =
        }

        if (isOptional) {
          paramType.modifiers |= Modifier.Optional;
          if (paramIndex < optionalAfter)
            optionalAfter = paramIndex;
        }

        // Add parameter to the list
        params.push(paramType);
        paramIndex++;

        // Skip to next parameter or end of list
        this.skipWhitespace();
        if (this.pos < this.input.length && this.input[this.pos] == ',') {
          this.pos++; // skip ,
          this.skipWhitespace();
        } else if (this.pos < this.input.length && this.input[this.pos] == ')') {
          break;
        } else if (this.pos >= this.input.length) {
          throw new Error(`Unexpected end of input after parameter at position ${this.pos}`);
        } else {
          throw new Error(`Expected ',' or ')' after parameter at position ${this.pos}`);
        }
      }

      // Skip closing parenthesis if present
      if (this.pos < this.input.length && this.input[this.pos] == ')') {
        this.pos++; // skip )
      } else {
        throw new Error(`Expected ')' at position ${this.pos}`);
      }
    }

    // Check if we've reached the end
    this.skipWhitespace();
    if (this.pos >= this.input.length)
      throw new Error(`Unexpected end of input after parameter list at position ${this.pos}`);

    // Expect => for return type
    if (this.pos + 1 >= this.input.length || this.input[this.pos] !== '=' || this.input[this.pos + 1] !== '>')
      throw new Error(`Expected '=>' after parameter list at position ${this.pos}`);
    this.pos += 2; // skip =>

    // Parse return type
    this.skipWhitespace();
    const returnType = this.parseType();

    // If optionalAfter is still very large, all parameters are required
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

    while (this.pos < this.input.length) {
      this.skipWhitespace();

      // Check for closing brace to end the struct
      if (this.input[this.pos] == '}') {
        this.pos++; // skip }
        break;
      }

      // Read property name
      const propName = this.readIdentifier();
      if (!propName) throw new Error(`Expected property name at position ${this.pos}`);

      // Check for optional property marker
      let isOptional = propName.endsWith('$');
      // Check for the standard optional property marker ?
      if (this.pos < this.input.length && this.input[this.pos] == '?') {
        isOptional = true;
        this.pos++; // skip ?
      }

      // Expect colon
      this.skipWhitespace();
      if (this.pos >= this.input.length || this.input[this.pos] !== ':')
        throw new Error(`Expected ':' after property name at position ${this.pos}`);
      this.pos++; // skip :

      // Parse the property type
      this.skipWhitespace();
      let propType = this.parseType();

      // If property is optional, set the Optional modifier
      if (isOptional)
        propType.modifiers |= Modifier.Optional;
      members[propName] = propType;

      // Skip trailing comma if present
      this.skipWhitespace();
      if (this.pos < this.input.length && this.input[this.pos] == ',') {
        this.pos++; // skip ,
      } else if (this.pos >= this.input.length) {
        throw new Error(`Unexpected end of input, expected ',' or '}'`);
      }
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
      let isNullable = false;
      if (this.pos < this.input.length && this.input[this.pos] == '?') {
        isNullable = true;
        this.pos++; // skip ?
      }

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
          this.pos++; // skip (
          type = this.parseFunctionType();
        } else {
          this.pos++; // skip (
          type = this.parseType();

          // Skip closing parenthesis if present
          if (this.pos < this.input.length && this.input[this.pos] == ')') {
            this.pos++; // skip )
          } else {
            throw new Error(`Expected ')' at position ${this.pos}`);
          }
        }
      }
      // Handle object types with braces
      else if (this.pos < this.input.length && this.input[this.pos] == '{') {
        this.pos++; // skip {
        type = this.parseStructType();
      }
      else {
        // Handle basic types
        const name = this.readIdentifier();
        if (!name) throw new Error(`Expected type name at position ${this.pos}`);

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
            this.pos++; // skip <
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

        this.skipWhitespace();
        if (this.pos >= this.input.length)
          throw new Error(`Unexpected end of input after '[' at position ${this.pos}`);

        if (this.pos >= this.input.length || this.input[this.pos] !== ']')
          throw new Error(`Expected ']' at position ${this.pos}`);
        this.pos++; // skip ]

        // Convert Type[] to Array<Type>
        const arrayType = new GenericType("Array", [type]);
        // Transfer modifiers from the element type to the array type
        if (type.modifiers & Modifier.Nullable)
          arrayType.modifiers |= Modifier.Nullable;
        type = arrayType;
      }

      // Handle nullable suffix
      if (this.pos < this.input.length && this.input[this.pos] == '?') {
        isNullable = true;
        this.pos++; // skip ?
      }

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
    while (this.pos < this.input.length && this.input[this.pos] !== '>') {
      const paramType = this.parseType();
      params.push(paramType);

      this.skipWhitespace();
      if (this.pos < this.input.length && this.input[this.pos] == ',') {
        this.pos++;
        this.skipWhitespace();
      } else if (this.pos >= this.input.length) {
        throw new Error(`Unexpected end of input, expected ',' or '>' at position ${this.pos}`);
      } else if (this.input[this.pos] !== '>') {
        throw new Error(`Expected ',' or '>' at position ${this.pos}, found '${this.input[this.pos]}'`);
      }
    }

    if (this.pos >= this.input.length)
      throw new Error(`Unexpected end of input, expected '>' at position ${this.pos}`);

    if (this.input[this.pos] == '>')
      this.pos++; // skip >
    else
      throw new Error(`Expected '>' at position ${this.pos}`);

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

  return {
    type,
    endPos
  };
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

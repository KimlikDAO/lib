import {
  FunctionType,
  GenericType,
  InstanceType,
  Modifier,
  PrimitiveType,
  PrimitiveTypes,
  StructType,
  Type,
  UnionType
} from "./types";

/**
 * @param {string} input
 * @param {boolean=} stopAtClosingBrace Whether to stop parsing when encountering an unmatched closing brace
 * @return {!Type}
 */
const parseType = (input, stopAtClosingBrace = false) => {
  let pos = 0;
  let braceLevel = 0;

  /** @return {void} */
  const skipWhitespace = () => {
    while (pos < input.length && /\s/.test(input[pos])) ++pos;
  }

  /** @return {string} */
  const readIdentifier = () => {
    let ident = "";
    while (pos < input.length && /[a-zA-Z0-9_$]/.test(input[pos])) {
      ident += input[pos++];
    }
    return ident;
  }

  /**
   * Parses a function type expression
   * @return {!FunctionType}
   */
  const parseFunctionType = () => {
    /** @const {!Array<!Type>} */
    const params = [];
    let optionalAfter = Number.MAX_SAFE_INTEGER;
    /** @type {Type | null} */
    let thisType = null;

    // Handle empty parameter list
    skipWhitespace();
    if (input[pos] === ')') {
      pos++; // skip )
    } else {
      // Parse parameters
      let paramIndex = 0;

      while (pos < input.length && input[pos] !== ')') {
        skipWhitespace();

        // Read parameter name (required)
        const paramName = readIdentifier();
        if (!paramName) {
          throw new Error(`Expected parameter name at position ${pos}`);
        }

        skipWhitespace();

        // Check for optional parameter with ?
        let isOptional = false;
        if (pos < input.length && input[pos] === '?') {
          isOptional = true;
          pos++; // skip ?
          skipWhitespace();
        }

        // Expect colon after parameter name (or after ? if optional)
        if (pos >= input.length || input[pos] !== ':') {
          throw new Error(`Expected ':' after parameter${isOptional ? ' optional marker' : ' name'} at position ${pos}`);
        }
        pos++; // skip :
        skipWhitespace();

        // Special handling for 'this' parameter
        if (paramName === 'this' && paramIndex === 0) {
          thisType = parseUnionType();

          // Skip to next parameter or end of list
          skipWhitespace();
          if (pos < input.length && input[pos] === ',') {
            pos++; // skip ,
            skipWhitespace();
            continue;
          } else if (pos < input.length && input[pos] === ')') {
            break;
          } else {
            throw new Error(`Expected ',' or ')' after 'this' parameter at position ${pos}`);
          }
        }

        // Parse parameter type
        const paramType = parseUnionType();

        // Check for optional parameter with =
        skipWhitespace();
        if (pos < input.length && input[pos] === '=') {
          isOptional = true;
          pos++; // skip =
        }

        // If this is the first optional parameter, record its position
        if (isOptional && paramIndex < optionalAfter)
          optionalAfter = paramIndex;

        // Add parameter to the list
        params.push(paramType);
        paramIndex++;

        // Skip to next parameter or end of list
        skipWhitespace();
        if (pos < input.length && input[pos] === ',') {
          pos++; // skip ,
          skipWhitespace();
        } else if (pos < input.length && input[pos] === ')') {
          break;
        } else {
          throw new Error(`Expected ',' or ')' after parameter at position ${pos}`);
        }
      }

      // Skip closing parenthesis
      if (pos >= input.length || input[pos] !== ')') {
        throw new Error(`Expected ')' at position ${pos}`);
      }
      pos++; // skip )
    }

    // Expect => for return type
    skipWhitespace();
    if (pos + 1 >= input.length || input[pos] !== '=' || input[pos + 1] !== '>') {
      throw new Error(`Expected '=>' after parameter list at position ${pos}`);
    }
    pos += 2; // skip =>

    // Parse return type
    skipWhitespace();
    const returnType = parseUnionType();

    // If optionalAfter is still MAX_SAFE_INTEGER, all parameters are required
    if (optionalAfter === Number.MAX_SAFE_INTEGER) {
      optionalAfter = params.length;
    }

    return new FunctionType(params, returnType, optionalAfter, thisType);
  }

  /** @return {!Type} */
  const parseUnionType = () => {
    const types = [parseTypeExpression()];

    skipWhitespace();
    // Stop if we hit a closing brace at the top level
    if (stopAtClosingBrace && braceLevel === 0 && pos < input.length && input[pos] === '}') {
      return types[0];
    }

    while (pos < input.length && input[pos] === '|') {
      pos++; // skip |
      skipWhitespace();
      types.push(parseTypeExpression());

      // Check again after parsing the next expression
      skipWhitespace();
      if (stopAtClosingBrace && braceLevel === 0 && pos < input.length && input[pos] === '}') {
        break;
      }
    }

    return types.length === 1 ? types[0] : new UnionType(types);
  }

  /**
   * Parses a struct/object type
   * @return {!StructType}
   */
  const parseStructType = () => {
    const members = {};

    while (pos < input.length && input[pos] !== '}') {
      skipWhitespace();

      // Check for end of struct
      if (input[pos] === '}') break;

      // Read property name
      const propName = readIdentifier();
      if (!propName) throw new Error(`Expected property name at position ${pos}`);

      // Check for optional property marker
      let isOptional = false;

      // Handle the special case where property name ends with $
      // This makes the type optional but keeps the $ in the name
      if (propName.endsWith('$')) {
        isOptional = true;
      }
      // Check for the standard optional property marker ?
      else if (pos < input.length && input[pos] === '?') {
        isOptional = true;
        pos++; // skip ?
      }

      // Expect colon
      skipWhitespace();
      if (pos >= input.length || input[pos] !== ':') {
        throw new Error(`Expected ':' after property name at position ${pos}`);
      }
      pos++; // skip :

      // Parse the property type
      skipWhitespace();
      let propType = parseUnionType();

      // If property is optional, make it a union with undefined
      if (isOptional) {
        const undefinedType = new PrimitiveType(PrimitiveTypes.Undefined, false);

        // If the property type is already a union, add undefined to it
        if (propType instanceof UnionType) {
          propType = new UnionType([...propType.types, undefinedType]);
        } else {
          // Otherwise create a new union
          propType = new UnionType([propType, undefinedType]);
        }
      }

      // Store the property
      members[propName] = propType;

      // Skip trailing comma if present
      skipWhitespace();
      if (pos < input.length && input[pos] === ',') {
        pos++; // skip ,
      } else if (pos < input.length && input[pos] !== '}') {
        throw new Error(`Expected ',' or '}' after property type at position ${pos}`);
      }
    }

    return new StructType(members);
  }

  /** @return {!Type} */
  const parseTypeExpression = () => {
    skipWhitespace();

    // Stop if we hit a closing brace at the top level
    if (stopAtClosingBrace && braceLevel === 0 && pos < input.length && input[pos] === '}') {
      throw new Error("Unexpected closing brace");
    }

    // Handle nullable prefix
    let isNullable = false;
    if (input[pos] === '?') {
      isNullable = true;
      pos++; // skip ?
    }

    let type;

    // Handle function types
    if (input[pos] === '(') {
      // Look ahead to see if this is a function type or just a parenthesized type
      const startPos = pos;
      pos++; // skip (

      // Try to determine if this is a function type
      let isFunctionType = false;
      let parenLevel = 1;
      let foundArrow = false;

      // Simple lookahead to check for => after a closing parenthesis
      for (let i = pos; i < input.length && !foundArrow; i++) {
        if (input[i] === '(') parenLevel++;
        else if (input[i] === ')') {
          parenLevel--;
          if (parenLevel === 0) {
            // Check for => after the closing parenthesis
            for (let j = i + 1; j < input.length; j++) {
              if (/\s/.test(input[j])) continue;
              if (j + 1 < input.length && input[j] === '=' && input[j + 1] === '>') {
                isFunctionType = true;
                foundArrow = true;
              }
              break;
            }
          }
        }
      }

      // Reset position
      pos = startPos;

      if (isFunctionType) {
        pos++; // skip (
        type = parseFunctionType();
      } else {
        pos++; // skip (
        type = parseUnionType();
        if (pos >= input.length || input[pos] !== ')') throw new Error("Expected )");
        pos++; // skip )
      }
    }
    // Handle object types with braces
    else if (input[pos] === '{') {
      pos++; // skip {
      braceLevel++;
      type = parseStructType();
      if (pos >= input.length || input[pos] !== '}') throw new Error("Expected }");
      braceLevel--;
      pos++; // skip }
    }
    else {
      // Handle basic types
      const name = readIdentifier();
      if (!name) throw new Error(`Expected type name at ${pos}`);

      // Special handling for primitive types
      if (Object.values(PrimitiveTypes).includes(name))
        type = new PrimitiveType(name, isNullable);
      else {
        // Handle generic types
        skipWhitespace();
        if (pos < input.length && input[pos] === '<') {
          pos++; // skip <
          const params = parseTypeParams();
          type = new GenericType(name, params, isNullable);
        } else {
          type = new InstanceType(name, isNullable);
        }
      }
    }

    // Handle array notation
    skipWhitespace();
    while (pos < input.length && input[pos] === '[') {
      pos++; // skip [
      if (pos >= input.length || input[pos] !== ']') throw new Error("Expected ]");
      pos++; // skip ]
      // Convert Type[] to Array<Type>
      type = new GenericType("Array", [type], isNullable);
    }

    // Handle nullable suffix
    skipWhitespace();
    if (pos < input.length && input[pos] === '?') {
      pos++; // skip ?
      isNullable = true;

      // Update the type to be nullable
      if (type instanceof PrimitiveType) {
        type = new PrimitiveType(type.name, true);
      } else if (type instanceof InstanceType) {
        type = new InstanceType(type.name, true);
      } else if (type instanceof GenericType) {
        type = new GenericType(type.name, type.params, true);
      } else {
        // For other types, we might need to handle differently
        // For now, just set the nullable flag
        type.modifiers |= Modifier.Nullable;
      }
    }
    return type;
  }

  /** @return {!Array<!Type>} */
  const parseTypeParams = () => {
    const params = [];
    while (pos < input.length && input[pos] !== '>') {
      params.push(parseUnionType()); // Parse unions in type params
      skipWhitespace();
      if (pos < input.length && input[pos] === ',') {
        pos++;
        skipWhitespace();
      }
    }
    if (pos >= input.length) throw new Error("Unexpected end of input, expected '>'");
    pos++; // skip >
    return params;
  }

  const result = parseUnionType(); // Start with union parsing

  // Ensure we've consumed the entire input, unless we're stopping at a closing brace
  skipWhitespace();
  if (!stopAtClosingBrace && pos < input.length) {
    throw new Error(`Unexpected characters at position ${pos}: ${input.slice(pos)}`);
  }

  return result;
}

/**
 * Parses a type expression from a JSDoc comment.
 * @param {string} input - The JSDoc type expression, including the curly braces
 * @return {!Type}
 */
const parseJSDocType = (input) => {
  // Find the opening brace
  const openBraceIndex = input.indexOf('{');
  if (openBraceIndex === -1) {
    throw new Error("No opening brace found in JSDoc type");
  }

  // Extract the content between braces, but include the closing brace
  // so the parser can detect it and stop
  const typeExpression = input.substring(openBraceIndex + 1);

  // Parse with the stopAtClosingBrace flag set to true
  return parseType(typeExpression, true);
}

export {
  parseJSDocType, parseType
};

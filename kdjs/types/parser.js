import {
  Type,
  UnionType,
  GenericType,
  InstanceType,
} from "./types";

/**
 * @param {string} input
 * @return {!Type}
 */
const parseType = (input) => {
  let pos = 0;

  /** @return {void} */
  const skipWhitespace = () => {
    while (pos < input.length && /\s/.test(input[pos])) pos++;
  }

  /** @return {string} */
  const readIdentifier = () => {
    let ident = "";
    while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) {
      ident += input[pos++];
    }
    return ident;
  }

  /** @return {!Type} */
  const parseUnionType = () => {
    const types = [parseTypeExpression()];

    skipWhitespace();
    while (pos < input.length && input[pos] === '|') {
      pos++; // skip |
      skipWhitespace();
      types.push(parseTypeExpression());
    }

    return types.length === 1 ? types[0] : new UnionType(types);
  }

  /** @return {!Type} */
  const parseTypeExpression = () => {
    skipWhitespace();

    // Handle non-nullable prefix
    const isNonNullable = input[pos] === '!';
    if (isNonNullable) pos++;

    let type;

    // Handle parenthesized types
    if (input[pos] === '(') {
      pos++; // skip (
      type = parseUnionType();
      if (input[pos] !== ')') throw new Error("Expected )");
      pos++; // skip )
    } else {
      // Handle basic types
      const name = readIdentifier();
      if (!name) throw new Error(`Expected type name at ${pos}`);

      // Handle generic types
      if (input[pos] === '<') {
        pos++; // skip <
        const params = parseTypeParams();
        type = new GenericType(name, params, !isNonNullable);
      } else {
        type = new InstanceType(name, !isNonNullable);
      }
    }

    // Handle array notation
    skipWhitespace();
    while (pos < input.length && input[pos] === '[') {
      pos++; // skip [
      if (input[pos] !== ']') throw new Error("Expected ]");
      pos++; // skip ]
      // Convert Type[] to !Array<Type>
      type = new GenericType("Array", [type], false);
    }

    return type;
  }

  /** @return {!Array<!Type>} */
  const parseTypeParams = () => {
    const params = [];
    while (pos < input.length && input[pos] !== '>') {
      params.push(parseUnionType()); // Parse unions in type params
      skipWhitespace();
      if (input[pos] === ',') {
        pos++;
        skipWhitespace();
      }
    }
    pos++; // skip >
    return params;
  }

  return parseUnionType(); // Start with union parsing
}

export {
  parseType
};

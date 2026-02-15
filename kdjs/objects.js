
/**
 * @param {acorn.ObjectExpression} objExpr
 * @return {string}
 */
const serializeWithStringKeys = (objExpr, sourceCode) => {
  return "{\n  " + objExpr.properties.map((prop) => {
    /** @const {string} */
    const key = prop.key.type === 'Identifier'
      ? /** @type {!acorn.Identifier} */(prop.key).name
      : ("" + /** @type {!acorn.Literal} */ (prop.key).value);
    /** @const {string} */
    const value = prop.shorthand
      ? key : sourceCode.slice(prop.value.start, prop.value.end);
    return `"${key}": ${value}`;
  }).join(",\n  ") + "\n}";
}

export {
  serializeWithStringKeys
};

/** @const */
const csstree = {};

/**
 * @typedef {{
 *   offset: number,
 *   line: number,
 *   column: number
 * }}
 */
csstree.Position;

/**
 * @typedef {{
 *   source: string,
 *   start: csstree.Position,
 *   end: csstree.Position
 * }}
 */
csstree.Location;

/**
 * @typedef {{
 * }}
 */
csstree.ParseOptions;

/**
 * @param {string} text
 * @param {csstree.ParseOptions} options
 * @return {!css.Node}
 */
const parse = (text, options) => { }

/** 
 * @param {!css.Node} ast
 * @param {csstree.GenerateOptions} options
 * @return {string}
 */
const generate = (ast, options) => { }

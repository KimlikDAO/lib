/** @const */
const css = {};

/**
 * @interface
 * @struct
 */
css.BaseNode = function () { }

/** @const {string} */
css.BaseNode.prototype.type;

/**
 * @typedef {{
 *   line: number,
 *   column: number
 * }}
 */
css.Position;

/**
 * @const {{
 *   content: string,
 *   start: css.Position,
 *   end: css.Position
 * }}
 */
css.BaseNode.prototype.position;

/**
 * @interface
 * @extends {css.BaseNode}
 */
css.Rule = function () { }

/** @const {!Array<string>} */
css.Rule.prototype.selectors;

/**
 * @interface
 * @extends {css.BaseNode}
 */
css.Comment = function () { }

/** @const {string} */
css.Comment.prototype.comment;

/**
 * @interface
 * @extends {css.BaseNode}
 */
css.Stylesheet = function () { }

/**
 * @const {{
 *  rules: !Array<!css.Rule|!css.Comment|!css.Media>
 * }}
 */
css.Stylesheet.prototype.stylesheet;

/**
 * @interface
 * @extends {css.BaseNode}
 */
css.Media = function () { }

/** @const {!Array<!css.Rule|!css.Comment|!css.Media>} */
css.Media.prototype.rules;

/**
 * @param {string} content
 * @return {!css.Stylesheet}
 */
css.parse = (content) => { };

export default css;

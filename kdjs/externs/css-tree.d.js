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
 *   prev: ?csstree.ListItem,
 *   next: ?csstree.ListItem,
 *   data: !csstree.CssNode
 * }}
 */
csstree.ListItem;

/**
 * @typedef {{
 *   head: ?csstree.ListItem,
 *   tail: ?csstree.ListItem,
 * }}
 */
csstree.List;

/**
 * @interface
 */
csstree.Node = function () { };

/** @const {string} */
csstree.Node.prototype.type;

/** @const {csstree.Location} */
csstree.Node.prototype.loc;

/**
 * @interface
 */
csstree.Comment = function () { };

/** @const {string} */
csstree.Comment.prototype.value;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.StyleSheet = function () { };

/** @const {!csstree.List} */
csstree.StyleSheet.prototype.children;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.Rule = function () { };

/** @const {!csstree.SelectorList} */
csstree.Rule.prototype.prelude;

/**
 * TODO(KimlikDAO-bot): Add other types
 * @typedef {csstree.Selector|csstree.IdSelector|csstree.ClassSelector}
 */
csstree.CssNode;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.SelectorList = function () { };

/** @const {!csstree.List} */
csstree.SelectorList.prototype.children;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.Selector = function () { };

/** @const {!csstree.List} */
csstree.Selector.prototype.children;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.IdSelector = function () { };

/** @const {string} */
csstree.IdSelector.prototype.name;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.ClassSelector = function () { };

/** @const {string} */
csstree.ClassSelector.prototype.name;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.Atrule = function () { };

/** @const {string} */
csstree.Atrule.prototype.name;

/** @const {!csstree.Block} */
csstree.Atrule.prototype.block;

/**
 * @interface
 * @extends {csstree.Node}
 */
csstree.Block = function () { };

/** @const {!csstree.List} */
csstree.Block.prototype.children;

/**
 * @param {string} text
 * @return {!csstree.StyleSheet}
 */
csstree.parse = (text) => { }

/** 
 * @param {!csstree.Node} ast
 * @return {string}
 */
csstree.generate = (ast) => { }

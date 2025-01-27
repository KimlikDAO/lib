import acorn from "acorn";

/** @return {!acorn.Plugin} */
const acornJsx = function () { }

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXElement = function () { };

/** @const {!acorn.JSXOpeningElement} */
acorn.JSXElement.prototype.openingElement;

/** @const {!acorn.JSXClosingElement|undefined} */
acorn.JSXElement.prototype.closingElement;

/** @const {!Array<!acorn.Node>} */
acorn.JSXElement.prototype.children;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXOpeningElement = function () { };

/** @const {!acorn.JSXIdentifier} */
acorn.JSXOpeningElement.prototype.name;

/** @const {!Array<!acorn.JSXAttribute>} */
acorn.JSXOpeningElement.prototype.attributes;

/** @const {boolean} */
acorn.JSXOpeningElement.prototype.selfClosing;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXClosingElement = function () { };

/** @const {!acorn.JSXIdentifier} */
acorn.JSXClosingElement.prototype.name;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXIdentifier = function () { };

/** @const {string} */
acorn.JSXIdentifier.prototype.name;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXAttribute = function () { };

/** @const {!acorn.JSXIdentifier} */
acorn.JSXAttribute.prototype.name;

/** @const {!acorn.Literal|!acorn.JSXExpressionContainer|undefined} */
acorn.JSXAttribute.prototype.value;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXExpressionContainer = function () { };

/** @const {!acorn.Node} */
acorn.JSXExpressionContainer.prototype.expression;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXText = function () { };

/** @const {string} */
acorn.JSXText.prototype.value;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXFragment = function () { };

/** @const {!acorn.JSXOpeningFragment} */
acorn.JSXFragment.prototype.openingFragment;

/** @const {!acorn.JSXClosingFragment} */
acorn.JSXFragment.prototype.closingFragment;

/** @const {!Array<!acorn.Node>} */
acorn.JSXFragment.prototype.children;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXOpeningFragment = function () { };

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.JSXClosingFragment = function () { };

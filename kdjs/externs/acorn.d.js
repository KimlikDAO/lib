/** @externs */

/** @const */
const acorn = {};

/**
 * @typedef {{
 *   ecmaVersion: string,
 *   sourceType: string
 * }}
 */
acorn.ParseOptions;

/**
 * @constructor
 * @struct
 */
acorn.Node = function () { }

/** @const {number} */
acorn.Node.prototype.start;

/** @const {number} */
acorn.Node.prototype.end;

/** @const {string} */
acorn.Node.prototype.type;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.Program = function () { }

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.Identifier = function () { }

/** @const {string} */
acorn.Identifier.prototype.name;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.Literal = function () { }

/** @const {!bigint|string|number} */
acorn.Literal.value;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.Property = function () { }

/**
 * TODO(KimlikDAO-bot): fix
 * @const {!acorn.Identifier}
 */
acorn.Property.prototype.key;

/**
 * TODO(KimlikDAO-bot): fix
 * @const {!acorn.Node}
 */
acorn.Property.prototype.value;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.MemberExpression = function () { }

/**
 * TODO(KimlikDAO-bot): fix
 * @const {!acorn.Identifier}
 */
acorn.MemberExpression.prototype.object;

/**
 * TODO(KimlikDAO-bot): fix
 * @const {!acorn.Identifier}
 */
acorn.MemberExpression.prototype.property;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.FunctionDeclaration = function () { };

/** @const {!acorn.Identifier} */
acorn.FunctionDeclaration.prototype.id;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.VariableDeclarator = function () { };

/** @const {!acorn.Identifier} */
acorn.VariableDeclarator.prototype.id;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.VariableDeclaration = function () { };

/** @const {string} */
acorn.VariableDeclaration.prototype.kind;

/** @const {!Array<!acorn.VariableDeclarator>} */
acorn.VariableDeclaration.prototype.declarations;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ClassDeclaration = function () { };

/** @const {!acorn.Identifier} */
acorn.ClassDeclaration.prototype.id;

/**
 * @typedef {(!acorn.FunctionDeclaration|!acorn.VariableDeclaration|!acorn.ClassDeclaration)}
 */
acorn.Declaration;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.AssignmentExpression = function () { }

/**
 * TODO(KimlikDAO-bot): fix
 * @const {acorn.Identifier} */
acorn.AssignmentExpression.prototype.left;

/**
 * TODO(KimlikDAO-bot): fix
 * @const {!acorn.Node}
 */
acorn.AssignmentExpression.prototype.right;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ObjectExpression = function () { }

/** @const {!Array<acorn.Property>} */
acorn.ObjectExpression.prototype.properties;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ImportDefaultSpecifier = function () { }

/** @const {!acorn.Identifier} */
acorn.ImportDefaultSpecifier.prototype.local;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ImportSpecifier = function () { }

/** @const {!acorn.Identifier|!acorn.Literal} */
acorn.ImportSpecifier.prototype.imported;

/** @const {!acorn.Identifier} */
acorn.ImportSpecifier.prototype.local;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ImportDeclaration = function () { }

/**
 * TODO(KimlikDAO-bot): Add ImportNameSpaceSpecifier
 * @const {!Array<!acorn.ImportSpecifier|!acorn.ImportDefaultSpecifier>}
 */
acorn.ImportDeclaration.prototype.specifiers;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ExportSpecifier = function () { }

/** @const {string} */
acorn.ExportSpecifier.prototype.exported;

/** @const {string} */
acorn.ExportSpecifier.prototype.local;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ExportDefaultDeclaration = function () { }

/**
 * TODO(KimlikDAO-bot): fix
 * @const {!acorn.Identifier}
 */
acorn.ExportDefaultDeclaration.prototype.declaration;

/**
 * @constructor
 * @struct
 * @extends {acorn.Node}
 */
acorn.ExportNamedDeclaration = function () { }

/** @const {!acorn.Declaration|undefined} */
acorn.ExportNamedDeclaration.prototype.declaration;

/** @const {!Array<!acorn.ExportSpecifier>} */
acorn.ExportNamedDeclaration.prototype.specifiers;

/**
 * @param {string} content
 * @param {acorn.ParseOptions} options
 * @return {!acorn.Program}
 */
const parse = (content, options) => { }

export default acorn;

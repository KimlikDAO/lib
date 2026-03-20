import acorn from "acorn";

/**
 * @constructor
 */
acorn.SimpleVisitor = function () { }

/** @const {function(this:acorn.SimpleVisitor, !acorn.Literal)|undefined} */
acorn.SimpleVisitor.prototype.Literal;

/** @const {function(this:acorn.SimpleVisitor, !acorn.AssignmentExpression)|undefined} */
acorn.SimpleVisitor.prototype.AssignmentExpression;

/** @const {function(this:acorn.SimpleVisitor, acorn.ExportDefaultDeclaration)|undefined} */
acorn.SimpleVisitor.prototype.ExportDefaultDeclaration;

/** @const {function(this:acorn.SimpleVisitor, acorn.ExportNamedDeclaration)|undefined} */
acorn.SimpleVisitor.prototype.ExportNamedDeclaration;

/** @const {function(this:acorn.SimpleVisitor, acorn.ImportDeclaration)|undefined} */
acorn.SimpleVisitor.prototype.ImportDeclaration;

/**
 * @param {!acorn.Program} program
 * @param {!acorn.SimpleVisitor} visitor
 */
const simple = (program, visitor) => { }

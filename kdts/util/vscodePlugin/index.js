"use strict";

function init(modules) {
  const ts = modules.typescript;
  const TYPE_IMPORT_IN_JS_CODE = 18042;
  const JSX_COMPONENT_TYPE_CODES = new Set([2604, 2786]);

  const isJsLike = (fileName) =>
    typeof fileName == "string" && /\.(c|m)?jsx?$/.test(fileName);

  const isJsxLike = (fileName) =>
    typeof fileName == "string"
    && (/\.(c|m)?jsx$/.test(fileName) || /\.tsx$/.test(fileName));

  const findNodeAt = (sourceFile, pos) => {
    let current = sourceFile;
    while (true) {
      let next = null;
      current.forEachChild((child) => {
        if (!next && pos >= child.pos && pos < child.end)
          next = child;
      });
      if (!next) return current;
      current = next;
    }
  };

  const enclosingJsxTagName = (sourceFile, pos) => {
    let current = findNodeAt(sourceFile, pos);
    while (current) {
      if (ts.isJsxOpeningElement(current) || ts.isJsxSelfClosingElement(current))
        return current.tagName;
      current = current.parent;
    }
    return null;
  };

  const propertyNameText = (name) => {
    if (!name) return "";
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
      return name.text;
    return "";
  };

  const isFunctionValue = (node) =>
    ts.isArrowFunction(node) || ts.isFunctionExpression(node);

  const objectHasRenderMethod = (node) =>
    ts.isObjectLiteralExpression(node) && node.properties.some((prop) => {
      if (!prop.name || propertyNameText(prop.name) != "render") return false;
      return ts.isMethodDeclaration(prop)
        || (ts.isPropertyAssignment(prop) && isFunctionValue(prop.initializer));
    });

  const singletonInitializer = (node) => {
    if (objectHasRenderMethod(node)) return node;
    if (!ts.isCallExpression(node) || node.arguments.length != 1) return null;
    const callee = node.expression;
    if (!ts.isIdentifier(callee) || (callee.text != "single" && callee.text != "singleton"))
      return null;
    return objectHasRenderMethod(node.arguments[0]) ? node.arguments[0] : null;
  };

  const symbolDeclaresSingleton = (checker, symbol, seen = new Set()) => {
    if (!symbol || seen.has(symbol)) return false;
    seen.add(symbol);
    if (symbol.flags & ts.SymbolFlags.Alias)
      symbol = checker.getAliasedSymbol(symbol);

    return !!symbol?.declarations?.some((decl) => {
      if (ts.isVariableDeclaration(decl) || ts.isPropertyAssignment(decl))
        return !!decl.initializer && !!singletonInitializer(decl.initializer);
      if (ts.isExportAssignment(decl))
        return !!singletonInitializer(decl.expression);
      if (ts.isShorthandPropertyAssignment(decl))
        return symbolDeclaresSingleton(
          checker,
          checker.getShorthandAssignmentValueSymbol(decl),
          seen
        );
      return false;
    });
  };

  const isSingletonJsxDiagnostic = (program, fileName, diag) => {
    if (!program || !diag || !JSX_COMPONENT_TYPE_CODES.has(diag.code) || !isJsxLike(fileName))
      return false;
    if (typeof diag.start != "number") return false;

    const sourceFile = program.getSourceFile(fileName);
    const checker = program.getTypeChecker();
    if (!sourceFile || !checker) return false;

    const tagName = enclosingJsxTagName(sourceFile, diag.start);
    if (!tagName) return false;

    const symbol = checker.getSymbolAtLocation(tagName)
      || ("name" in tagName && checker.getSymbolAtLocation(tagName.name));
    return symbolDeclaresSingleton(checker, symbol);
  };

  const shouldKeep = (program, fileName, diag) => {
    if (!diag) return false;
    if (diag.code == TYPE_IMPORT_IN_JS_CODE) return false;
    return !isSingletonJsxDiagnostic(program, fileName, diag);
  };

  const filter = (program, fileName, diagnostics) =>
    (isJsLike(fileName) || isJsxLike(fileName))
      ? diagnostics.filter((diag) => shouldKeep(program, fileName, diag))
      : diagnostics;

  function create(info) {
    const ls = info.languageService;
    const proxy = Object.create(null);
    for (const k of Object.keys(ls)) {
      const x = ls[k];
      proxy[k] = typeof x == "function" ? x.bind(ls) : x;
    }

    proxy.getSemanticDiagnostics = (fileName) =>
      filter(ls.getProgram(), fileName, ls.getSemanticDiagnostics(fileName));

    proxy.getSuggestionDiagnostics = (fileName) =>
      filter(ls.getProgram(), fileName, ls.getSuggestionDiagnostics(fileName));

    return proxy;
  }

  return { create };
}

module.exports = init;

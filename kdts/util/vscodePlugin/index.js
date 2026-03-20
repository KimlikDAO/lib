"use strict";

function init(modules) {
  const TYPE_IMPORT_IN_JS_CODE = 18042;

  const isJsLike = (fileName) =>
    typeof fileName == "string" && /\.(c|m)?jsx?$/.test(fileName);

  const shouldKeep = (diag) => {
    if (!diag) return false;
    return diag.code != TYPE_IMPORT_IN_JS_CODE;
  };

  const filter = (fileName, diagnostics) =>
    isJsLike(fileName) ? diagnostics.filter(shouldKeep) : diagnostics;

  function create(info) {
    const ls = info.languageService;
    const proxy = Object.create(null);
    for (const k of Object.keys(ls)) {
      const x = ls[k];
      proxy[k] = typeof x == "function" ? x.bind(ls) : x;
    }

    proxy.getSemanticDiagnostics = (fileName) =>
      filter(fileName, ls.getSemanticDiagnostics(fileName));

    proxy.getSuggestionDiagnostics = (fileName) =>
      filter(fileName, ls.getSuggestionDiagnostics(fileName));

    return proxy;
  }

  return { create };
}

module.exports = init;

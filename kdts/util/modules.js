/**
 * local: imported
 * 
 * @typedef {{
 *   unnamed?: string,
 *   isNamespace?: boolean,
 *   named: Record<string, string>,
 *   source?: string
 * }}
 */
const ImportStatement = {};

/**
 * exported: local
 *
 * @typedef {{
 *   unnamed?: string,
 *   named: Record<string, string>
 * }}
 */
const ExportStatement = {};

/**
 * @param {ImportStatement} importStmt
 * @param {string} source
 * @return {string}
 */
const writeImportStatement = (importStmt, source) => {
  let out = "import";
  if (importStmt.unnamed)
    out += (importStmt.isNamespace ? " *as " : " ") + importStmt.unnamed
  const named = Object.entries(importStmt.named);
  if (named.length) {
    named.sort((a, b) => a[0].localeCompare(b[0]));
    out += importStmt.unnamed ? ",{" : "{";
    out += named.map((dec) => !dec[1] || dec[0] == dec[1]
      ? dec[0] : `${dec[1]} as ${dec[0]}`)
      .join(",") + "}from";
  } else if (importStmt.unnamed) out += " from";
  return out + `"${source}";`;
}

export {
  ExportStatement,
  ImportStatement,
  writeImportStatement
};
